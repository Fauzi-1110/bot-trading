const fs = require("fs")
const c = require("chalk")
const moment = require("moment-timezone")
const dbSystem = require("./func_db.js")
const {
    formatNumber,
    getHargarata,
    kerjaBot
} = require("./func_other.js")
const {
    buyVolume,
    sellVolume,
    tempPerubahan
} = require("./func_cointem.js")

/*
const { randomBotTrading,
    updateBotName,
    addBotEffect,
    clearBotEffect
} = require("./func_bot.js")
*/

async function randomBotTrading() {
    //dapetin semua user bot
    const getdb = dbSystem.getAllUser()
    const allBot = Object.entries(getdb).filter(([k, v]) => v.type === "bot")
    const party_aktif = dbSystem.getGlobalKey("party_on")

    //membuat bot random mana saja yang akan imvestasi
    const botOn = []
    allBot.forEach(([id, data]) => {
        let on_persen = 40
        
        if(data.aktif?.last_season_aktif) on_persen += 3
        if (data.role === "fast") on_persen += 13
        else if (data.role == "super") on_persen += 15
        if (data.party_id !== 0) on_persen += 5
        if (data.party_id !== 0 && party_aktif[data.party_id] && party_aktif[data.party_id].type === "fast") on_persen += 10
        if (data.party_id !== 0 && party_aktif[data.party_id] && party_aktif[data.party_id].member.some((id_member) => botOn.includes(`${id_member}`))) on_persen += 13
        
        //console.log(`${id} get persen: ${on_persen}`)
        if (Math.random() >= (100-on_persen) / 100) botOn.push(id)
    })
    
    console.log(c.blueBright(`\n\nSebanyak ${botOn.length} telah on pada saat ini!`))
    //menjalankan tiap" bot
    const promise = botOn.map((id) => normalBuy(id))
    Promise.all(promise)
        .finally(() => console.log(c.blueBright(`diakhiri bot id: ${botOn[botOn.length-1]} waktu: ${moment().tz("Asia/Jakarta").format("HH:mm:ss")}`)))
}

async function normalBuy(id){
    kerjaBot(id)
    updateBotName(id)
    await dbSystem.createDBUser("bot", id);
    
    //pengambulan dri database
    const [global_object, bot_data, data_temp] = [dbSystem.getGlobal(), dbSystem.getUser(id), {}]
    if(bot_data.kejahatan.penjara === true)return
    
    //data utama
    const item_list = [
        { nama: "perak", nama_global: "hargaPerak" },
        { nama: "emas", nama_global: "hargaEmas" },
        { nama: "platinum", nama_global: "hargaPlatinum" },
        { nama: "diamond", nama_global: "hargaDiamond" },
        { nama: "balaceCoin", nama_global: "balaceCoin" },
        { nama: "roadaCoin", nama_global: "roadaCoin" },
        { nama: "flagCoin", nama_global: "flagCoin" },
        { nama: "timenCoin", nama_global: "timenCoin" },
        { nama: "loyaliCoin", nama_global: "loyaliCoin" },
    ]

    item_list.forEach((k, i) => {
        item_list[i].harga = global_object[k.nama_global]
    })
    
    //mendeteksi apakah bot udah punya item
    const haved = item_list.some((k) => bot_data[k.nama] > 0)
    
     //party
    const party_aktif = global_object.party_on
    const user_party = party_aktif[bot_data.party_id] || false
    
    if (haved) {
        //mencari item yang dimikiki
        const item_sell_data = item_list.filter((k) => bot_data[k.nama] > 0)[0]
        if(user_party.type === "borongan" && item_sell_data.nama_global === user_party.beli_barang) { partyBorongan(id); return }
        
        //menghitung jumlah dan total harga untuk dijual
        let jumlah = bot_data[item_sell_data.nama] || 0
        let totalHarga = jumlah * item_sell_data.harga
        
        // sistem skip transaksinuntuk meminimalisir jerugian
        if ((( (bot_data.role === "smart" || bot_data.role === "super" || (user_party && user_party.type === "smart")) && bot_data.skip_transaksi <= 20) || 
            ( bot_data.skip_transaksi <= 3 )) &&
            bot_data.lastHarga > item_sell_data.harga ){
            dbSystem.addUserKey(id, "skip_transaksi", 1)
            return
        } 
        
        //jika transaksi menjual lanjut dan terdeteksi rugi, maka jual 50% aja
        if(bot_data.lastHarga - item_sell_data.harga > 5){
            jumlah = jumlah > 100 ? Math.floor(jumlah * 0.40) : jumlah
            totalHarga = jumlah * item_sell_data.harga
        }
        
        //tambah profit ke bot
        const modal = bot_data.profit[item_sell_data.nama+"_modal"]
        const hargaRata = modal / bot_data[item_sell_data.nama]
        const totalProfit = Math.round((item_sell_data.harga - hargaRata) * jumlah)
        const updateModal = modal - Math.floor(hargaRata*jumlah)
        
        //totsl.profit
        const totalProfitFinal = bot_data.profit.perak + bot_data.profit.emas +
                                 bot_data.profit.platinum + bot_data.profit.diamond +
                                 bot_data.profit.balaceCoin + bot_data.profit.roadaCoin +
                                 bot_data.profit.flagCoin + bot_data.profit.timenCoin +
                                 bot_data.profit.loyaliCoin
        
        //tambah semuanya ke obj temp
        sellVolume(item_sell_data.nama, jumlah)
        
        //buat profit
        data_temp.profit = {}
        if (bot_data[item_sell_data.nama] - jumlah === 0) data_temp.profit[item_sell_data.nama+"_modal"] = 0
        else data_temp.profit[item_sell_data.nama+"_modal"] = updateModal
        if (totalProfitFinal > bot_data.high_profit) data_temp.high_profit = totalProfitFinal
        data_temp.profit[item_sell_data.nama] = "add "+totalProfit
        data_temp.total_profit = totalProfitFinal
        
        data_temp.uang = "add "+totalHarga
        data_temp[item_sell_data.nama] = "add -"+ jumlah
        data_temp.jumlah_trading = "add 1"
        data_temp.skip_transaksi = 0
    } else {
        if (bot_data.role === "super" || bot_data.role === "smart") { smartBuy(id); return }
        if (user_party && user_party.type === "smart") { smartBuy(id); return }
        if (user_party && user_party.type === "borongan"){ partyBorongan(id); return }
        
        const diskon = user_party && user_party.type === "diskon" ? 0.95 : 1
        //mengambil barang" yang sesuai dengan modal
        const item_buy_list = item_list.filter((k, i) => bot_data.uang >= k.harga)

        if (item_buy_list.length === 0)return
        //buat nge random item apa yang bakal dibeli bot
        const randomBuy = Math.floor(Math.random() * item_buy_list.length)
        const item_buy_fix = item_buy_list[randomBuy]
        
        //ambil data terkait buat beli
        const item_buy = Math.floor(bot_data.uang / item_buy_fix.harga)
        let jumlah = item_buy >= 10000000 ? Math.floor(item_buy * 0.40):
                       item_buy >= 1000000 ? Math.floor(item_buy * 0.50) :
                       item_buy >= 100000 ? Math.floor(item_buy * 0.60) :
                       item_buy >= 10000 ? Math.floor(item_buy * 0.70) :
                       item_buy >= 1000 ? Math.floor(item_buy * 0.80) :
                       item_buy >= 100 ? Math.floor(item_buy * 0.90) :
                       item_buy
        if(jumlah > 20000000) jumlah = 20000000
        const totalHarga = Math.floor((jumlah * item_buy_fix.harga) * diskon)
        
        buyVolume(item_buy_fix.nama, jumlah)
        //tambah ke data temp
        data_temp.profit = {}
        data_temp.profit[item_buy_fix.nama+"_modal"] = totalHarga
        data_temp.lastHarga = item_buy_fix.harga
        data_temp[item_buy_fix.nama] = "add "+jumlah
        data_temp.uang = "add -"+ totalHarga
    }
    dbSystem.updateUser(id, data_temp)
}

// =======================
// Fungsi untuk pembelian pada bot smart/super/party smart
// =======================
async function smartBuy(id) {
    const [global_object, bot_data, data_temp] = [dbSystem.getGlobal(), dbSystem.getUser(id), {}]

    //dapetin item yang rekomended buat dibeli
    const item_list = [
        { nama: "perak", nama_global: "hargaPerak" },
        { nama: "emas", nama_global: "hargaEmas" },
        { nama: "platinum", nama_global: "hargaPlatinum" },
        { nama: "diamond", nama_global: "hargaDiamond" },
    ]

    item_list.forEach((k, i) => {
        item_list[i].harga = global_object[k.nama_global]
        item_list[i].volume = tempPerubahan(k.nama)
    })

    //cari yang akan ada kemungkinan naik dan turun dari data
    const itemBuy = []
    for (let data of item_list) {
        if (data.volume >= 500) itemBuy.push({
            nama: data.nama, global: data.nama_global, harga: data.harga
        })
    }

    // dapetin coin recomended buat beli
    const coin_list = [
        { nama: "balaceCoin", nama_chart: "balaceChart" },
        { nama: "roadaCoin", nama_chart: "roadaChart" },
        { nama: "flagCoin", nama_chart: "flagChart" },
        { nama: "timenCoin", nama_chart: "timenChart" },
        { nama: "loyaliCoin", nama_chart: "loyaliChart" }
    ]

    coin_list.forEach((k, i) => {
        coin_list[i].chart = global_object[k.nama_chart]
        coin_list[i].harga = global_object[k.nama]
    })

    const coinBuy = []
    const chartPola = [
        ["0", "0", "0", "0", "0"],
        ["0", "0", "1", "0", "0"],
        ["0", "1", "0", "1", "0"],
    ]

    for (let data of coin_list) {
        let same = false
        const chart = data.chart

        //nyamain chart saat ini dengan pola
        chartPola.forEach((full_pola) => {
            if (full_pola.every((pola_satuan, i) => pola_satuan === chart[i])) {
                coinBuy.push({
                    nama: data.nama, global: data.nama, harga: data.harga
                })
            }
        })
    }

    const buyKomendedAll = [...itemBuy, ...coinBuy]
    const buyRekomended = buyKomendedAll.filter((key) => bot_data.uang > key.harga)

    if (buyRekomended.length > 0) {
        const take_random = Math.floor(Math.random() * buyRekomended.length)
        const data = buyRekomended[take_random]

        let jumlah = Math.floor(bot_data.uang / data.harga)
        if(jumlah > 50000000) jumlah = 50000000
        const total_harga = jumlah * data.harga
        
        buyVolume(data.nama, jumlah)
        
        data_temp.profit = {}
        data_temp.profit[data.nama+"_modal"] = total_harga
        data_temp[data.nama] = "add "+jumlah
        data_temp.uang = "add -"+total_harga
        data_temp.lastHarga = data.harga
    }
    
    dbSystem.updateUser(id, data_temp)
}

// ================
// sistem transaksi party borongan
// ================
async function partyBorongan(id){
    const [user_data, global_db, data_temp] = [dbSystem.getUser(id), dbSystem.getGlobal(), {profit: {}}]
    const party_detail = global_db.party_on[user_data.party_id]
    const barang_transaksi = party_detail.beli_barang.split("harga")[1].toLowerCase()
    
    const sisa_waktu = (Math.floor(Date.now()/60000) % 2)
    if((party_detail.beli_waktu === "genap" && sisa_waktu === 0) || (party_detail.beli_waktu === "ganjil" && sisa_waktu != 0)){
        const jumlah = Math.floor(user_data.uang / global_db[party_detail.beli_barang]) || 0
        const total_harga = global_db[party_detail.beli_barang] * jumlah
        
        buyVolume(barang_transaksi, jumlah)
        data_temp.profit[barang_transaksi+"_modal"] = total_harga
        data_temp.lastHarga = global_db[party_detail.beli_barang]
        data_temp[barang_transaksi] = "add "+jumlah
        data_temp.uang = "add -"+total_harga
    } else {
        const jumlah = user_data[barang_transaksi] || 0
        const harga_satuan = global_db[party_detail.beli_barang]
        const total_harga = harga_satuan * jumlah
        if(jumlah <= 0)return
        
        //uodate modal
        const modal = user_data.profit[barang_transaksi+"_modal"]
        const hargaRata = modal / user_data[barang_transaksi]
        const totalProfit = Math.round((harga_satuan - hargaRata) * jumlah)
        const updateModal = modal - Math.floor(hargaRata*jumlah)
        if(user_data[barang_transaksi] - jumlah === 0) data_temp.profit[barang_transaksi+"_modal"] = 0
        else data_temp.profit[barang_transaksi+"_modal"] = updateModal
        data_temp.profit[barang_transaksi] = "add "+totalProfit
        
        //totsl.profit
        const totalProfitFinal = user_data.profit.perak + user_data.profit.emas +
                                 user_data.profit.platinum + user_data.profit.diamond +
                                 user_data.profit.balaceCoin + user_data.profit.roadaCoin +
                                 user_data.profit.flagCoin + user_data.profit.timenCoin +
                                 user_data.profit.loyaliCoin
        if (totalProfitFinal > user_data.high_profit) data_temp.high_profit = totalProfitFinal
        data_temp.total_profit = totalProfitFinal
        
        sellVolume(barang_transaksi, jumlah)
        data_temp.uang = "add "+total_harga
        data_temp[barang_transaksi] = "add -"+jumlah
        data_temp.jumlah_trading = "add 1"
        
    }
    dbSystem.updateUser(id, data_temp)
}


// =====================
// kumpulannfungsi untuk fitur party
// ====================
const party_fc = {
    add_party_borongan: async function(id){
        const random_list_borong = ["hargaPerak", "hargaEmas", "hargaPlatinum", "hargaDiamond"][Math.floor(Math.random() * 4)]
        const random_buy =  ["genap", "ganjil"][Math.floor(Math.random() * 2)]
        
        dbSystem.setGlobalKey("party_on."+id+".beli_barang", random_list_borong)
        dbSystem.setGlobalKey("party_on."+id+".beli_waktu", random_buy)
        
        console.log(c.blueBright("barang dibeli: "+random_list_borong))
        console.log(c.blueBright("waktu dibeli: "+random_buy))
    },
    add_party: async function() {
        const full_user = Object.entries(await dbSystem.getAllUser())
        const user_solo = full_user.filter(([k, v], i) => v.party_id === 0 && v.type === "bot")
        const party_data_default = await dbSystem.getGlobalKey("party_data")
        const party_id_has_haved = Object.keys(await dbSystem.getGlobalKey("party_on"))

        //mebuat party id
        let party_id_for_new = 1
        while(party_id_has_haved.includes(`${party_id_for_new}`)) {
            party_id_for_new += 1
        }
        
        //fungsi buat random user yang masuk ke dalam party
        const max_member = Math.floor(Math.random() * (party_data_default.max_member - 4)) + 4
        const user_join_party = []
        for (let i = 0; i < max_member; i++) {
            const random_take = Math.floor(Math.random() * user_solo.length)
            user_join_party.push(user_solo[random_take][0])
            user_solo.splice(random_take, 1)
        }
        for (let i = 0; i < user_join_party.length; i++) {
            dbSystem.setUserKey(user_join_party[i], "party_id", party_id_for_new)
        }

        //membuat detail data
        const party_type = party_data_default.type[Math.floor(Math.random() * party_data_default.type.length)]

        // lama party
        const jam = Math.floor(Math.random() * 5)
        const menit = Math.floor(Math.random() * 60)
        const lama_party = (jam*60)+menit

        //data ke db:
        // id: party_id_for_new
        // member: ...user_join_party
        // type: party_type
        // waktu_mulai: Math.floor(Date.now/60000)
        // waktu_limit: lama_party
        
        dbSystem.setGlobalKey("party_on."+party_id_for_new, {})
        dbSystem.setGlobalKey("party_on."+party_id_for_new+".id", party_id_for_new)
        dbSystem.setGlobalKey("party_on."+party_id_for_new+".member", user_join_party)
        dbSystem.setGlobalKey("party_on."+party_id_for_new+".type", party_type)
        dbSystem.setGlobalKey("party_on."+party_id_for_new+".waktu_mulai", Math.floor(Date.now()/60000))
        dbSystem.setGlobalKey("party_on."+party_id_for_new+".waktu_limit", lama_party)
        
        console.log(c.blueBright("\n\nNew Party Added!"))
        console.log(c.blueBright("party id: ", party_id_for_new))
        console.log(c.blueBright("member: ", user_join_party))
        console.log(c.blueBright("type: ", party_type))
        console.log(c.blueBright("wakti limit: ", lama_party))
        if(party_type === "borongan") this.add_party_borongan(party_id_for_new)
    },
    delete_party: async function(party_id){
        //dapetin object 
        const party_data = await dbSystem.getGlobalKey("party_on."+party_id)
        if(!party_data)return console.log(c.red(`party dengan id ${party_id} tidak ditemukan!`))
        
        //rwset semua bot party ke dagult 0
        for(let bot_id of party_data.member){
            dbSystem.setUserKey(bot_id, "party_id", 0)
        }
        
        dbSystem.deleteGlobalKey("party_on."+party_id)
        console.log(c.blueBright(`\n\nSistem telah menghapus party dengan id ${party_id}`))
    },
    check_party: async function(add){
        const party_data_entries = Object.entries(await dbSystem.getGlobalKey("party_on"))
        const party_expired = party_data_entries.filter(([k, v], i) => Math.floor(Date.now()/60000) - v.waktu_mulai >= v.waktu_limit && v.id <= 100)
        
        for(let [party_id, _] of party_expired){
            await this.delete_party(party_id)
        }
        
        if(party_data_entries.length <= 8 && add) this.add_party()
    }
}


function updateBotName(id) {
    const global_data = dbSystem.getGlobal()
    const bot_data = dbSystem.getUser(id)
    const botRole = bot_data.role
    let nama = bot_data.nama
    
    //⚡️, ⭐️, ✨,
    if (botRole === "fast") nama = "⚡ bot-"+id
    else if (botRole === "smart") nama = "⭐ bot-"+id
    else if (botRole === "super") nama = "✨ bot-"+id
    else if (botRole === "normal") nama = "bot-"+id
    
    if(global_data.last_season_top_sultan.includes(`${id}`)) nama = "👑 "+nama
    if(global_data.last_season_top_trader.includes(`${id}`)) nama = "🔱 "+nama
    if(bot_data.party_id !== 0) nama = "💢 " + nama + " 💢 -- "+bot_data.party_id
    
    dbSystem.setUserKey(id, "nama", nama)
}

// ===================
// fungsi" yg digunakan untuk effect (menambah dan menghapus)
//====================
async function addBotEffect(type, max) {
    const time = moment().tz("Asia/Jakarta").format("HH:mm:ss")
    console.log(`Memperbarui ${type}! (${time})`)

    // dapetin semua bot yang ada & filter
    const allBot = Object.values(dbSystem.getAllUser()).filter((k) => k.nama.includes("bot-") && (k.role === "normal" || k.role === type))
    const countBotHas = allBot.filter((k) => k.role == type)
    const sudah = []

    //deteksi kalau bot udah lebih
    if (countBotHas.length >= max)return `bot dengan role ${type} telah mencapai maximum!`
    if (countBotHas.length > 0) max -= countBotHas.length

    let botId,
    takeRandomBot
    for (let i = 0; i < max; i++) {
        takeRandomBot = Math.floor(Math.random() * allBot.length)
        botId = allBot[takeRandomBot].id

        while (sudah.includes(botId)) {
            if (type !== "super") break
            else {
                takeRandomBot = Math.floor(Math.random() * allBot.length)
                botId = allBot[takeRandomBot].id
            }
        }
        if (sudah.includes(botId)) continue
        sudah.push(botId)
        dbSystem.setUserKey(botId, "role", type)
    }

    console.log(c.blueBright(`${sudah.length} telah menjadi ${type}, yaitu: ${sudah}`))
    return `Berhasil menambahkan ${sudah.length} bot ke dalam role ${type} (${sudah}) `
}

function clearBotEffect(type) {
    function clearEffect(d) {
        const allBotSmart = Object.values(dbSystem.getAllUser()).filter((k) => k.role == d)
        allBotSmart.forEach((k) => dbSystem.setUserKey(k.id, "role", "normal"))
        console.log(c.blueBright(`Selesai membersihkan user ${d} (${allBotSmart})`))
    }

    if (type == "smart") clearEffect("smart")
    else if (type == "fast") clearEffect("fast")
    else if (type == "super")clearEffect("super")
    else {
        clearEffect("fast"); clearEffect("smart")
    }
}

module.exports = {
    randomBotTrading,
    updateBotName,
    addBotEffect,
    clearBotEffect,
    party_fc
}