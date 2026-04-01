const dbSystem = require(process.cwd()+"/lib/func_db")
const moment = require("moment-timezone")
const fs = require("fs")
const c = require("chalk")
//const chunk = require("lodash.chunk")

/*
const = {
    formatNumber,
    getHargarata
} = require("./func_other.js")
*/

module.exports = {
    formatNumber,
    getHargarata,
    kerjaBot,
    addHistoryPerubahanHarga,
    getLogHistoryPerubahanHarga,
    sleep,
    reset_season
}

async function sleep(second){
    return new Promise((resolve, reject) => {
        setTimeout(resolve, second*1000)
    })
}

function formatNumber(uang){
    return `${uang >= 1e21 ? Number(uang) : uang.toLocaleString("id")}`
}

function getHargarata(jumlahModal, jumlahBarang){
    return Math.round(jumlahModal/jumlahBarang)
}

async function kerjaBot(id){
    const user = await dbSystem.getUser(id)
    const pekerjaan_data_user = user.pekerjaan
    const pekerjaan_data_global = await dbSystem.getGlobalKey("pekerjaan")[pekerjaan_data_user.pekerjaan][0]
    
    const now = Math.floor(Date.now() / 1000)
    if(now - pekerjaan_data_user.last_kerja <= pekerjaan_data_global.cooldown) return
    
    if(pekerjaan_data_user.pekerjaan === "pengangguran"){
        //dapetin semua kerjaan 
        const pekerjaan_all = dbSystem.getGlobalKey("pekerjaan")
        const pekerjaan_list = Object.keys(await dbSystem.getGlobalKey("pekerjaan"))
        const pekerjaan_dapat_dilamar = []
        
        for(let job_key of pekerjaan_list){
            const job_data = pekerjaan_all[job_key][0]
            if(pekerjaan_data_user.pengalaman >= job_data.minimum) pekerjaan_dapat_dilamar.push(job_key)
        }
        
        const pekerjaan_lamar = pekerjaan_dapat_dilamar[pekerjaan_dapat_dilamar.length-1]
        const pekerjaan_lamar_data = pekerjaan_all[pekerjaan_lamar][0]
        
        dbSystem.setUserKey(id, "pekerjaan.pekerjaan", pekerjaan_lamar_data.pekerjaan)
        return
    }
    
    let gaji
    if(["pedagang", "pembisnis", "ceo"].includes(pekerjaan_data_user.pekerjaan)){
        const untung = Math.random() > 0.25
        const close = Math.random() < 0.1
        gaji = Math.floor(Math.random() * pekerjaan_data_global.gaji)
        if(!untung) gaji *= -1
        if(close) dbSystem.setUserKey(id, "pekerjaan.pekerjaan", "pengangguran")
    } else {
        const dipecat = Math.random() < 0.15
        gaji = pekerjaan_data_global.gaji + Math.round(Math.random() * (pekerjaan_data_global.gaji * 0.03))
        if(dipecat) dbSystem.setUserKey(id, "pekerjaan.pekerjaan", "pengangguran")
    }
    
    const data_update = {
        uang: "add "+gaji,
        pekerjaan: {
            last_kerja: now,
            pengalaman: "add 1"
        }
    }
    
    dbSystem.updateUser(id, data_update)
}

function addHistoryPerubahanHarga(data, item_name){
    function saveHistory(data){ fs.writeFileSync(process.cwd()+"/database/logHistory.json", JSON.stringify(data, null, 4)) }
    function getHistory(){
        try{
            return JSON.parse(fs.readFileSync(process.cwd()+"/database/logHistory.json")) || {} 
        } catch (e) {
            return {}
        }
    }
    
    const history_all = getHistory()
    if(!history_all[item_name]) history_all[item_name] = []
    const history = history_all[item_name]
    if(history.length >= 10) history_all[item_name].shift()
    
    const time = moment().tz("Asia/Jakarta").format("DD-MMMM-YYYY HH:mm")
    data.waktu = time
    
    history_all[item_name].push(data)
    saveHistory(history_all)
}

async function getLogHistoryPerubahanHarga(Client, fc, item_name){
    if(item_name){
        
    } else if(!item_name || ["perak", "emas", "platinum", "diamond", "balaceCoin", "roadaCoin", "flagCoin", "timenCoin", "loyaliCoin"].includes(item_name)){
        const all_history = JSON.parse(fs.readFileSync(process.cwd()+"/database/logHistory.json"))
        const keys = Object.keys(all_history)
        let teks = "History (hanya 10 perubahan harga yang diambil!)"
        
        //looping item
        for(let data_keys of keys){
            const data_history = all_history[data_keys]
            
            teks+= "\n\n\n============================="
            teks+= "\n----- "+data_keys
            teks+= "\n============================="
            
            //loping semua history
            for(let datanya of data_history){
                teks+= "\n"
                const keyskeys = Object.keys(datanya)
                
                //looping isi tiap" history
                for(let data of keyskeys ){
                    teks+= "\n"+data+": "+datanya[data]
                }
            }
        }
        
        fs.writeFileSync("./log.txt", teks)
        Client.sendDocument(fc.from, "./log.txt", {
            caption: "ini dia file log historynya",
            reply_to_message_id: fc.msg.id
        })
    }
}

async function reset_season(){
    const {
        addBotEffect,
        clearBotEffect,
        party_fc
    } = require(process.cwd()+"/lib/func_bot")
    const merge = require("lodash.merge")

    //dapetin semua user
    const [global_db, user_all] = dbSystem.getAllDB()
    const user_all_entries = Object.entries(user_all)
    
    //dapetin 3 top sultan
    const top_sultans = [...user_all_entries].sort(([k, v], [kk, vv]) => {
        const aset_a = v.uang +
                       ((v.perak || 0)* global_db.hargaPerak) +
                       ((v.emas || 0)* global_db.hargaEmas) +
                       ((v.platinum || 0)* global_db.hargaPlatinum) +
                       ((v.diamond || 0)* global_db.hargaDiamond) +
                       ((v.balaceCoin || 0)* global_db.balaceCoin) +
                       ((v.roadaCoin || 0)* global_db.roadaCoin) +
                       ((v.flagCoin || 0)* global_db.flagCoin) +
                       ((v.timenCoin || 0)* global_db.timenCoin) +
                       ((v.loyaliCoin || 0)* global_db.loyaliCoin) 
        
        const aset_b = vv.uang +
                       ((vv.perak || 0)* global_db.hargaPerak) +
                       ((vv.emas || 0)* global_db.hargaEmas) +
                       ((vv.platinum || 0)* global_db.hargaPlatinum) +
                       ((vv.diamond || 0)* global_db.hargaDiamond) +
                       ((vv.balaceCoin || 0)* global_db.balaceCoin) +
                       ((vv.roadaCoin || 0)* global_db.roadaCoin) +
                       ((vv.flagCoin || 0)* global_db.flagCoin) +
                       ((vv.timenCoin || 0)* global_db.timenCoin) +
                       ((vv.loyaliCoin || 0)* global_db.loyaliCoin) 
        
        return aset_b - aset_a
    }).slice(0, 3)
    const top_sultan = []
    top_sultans.forEach(([id, _]) => top_sultan.push(id))
    dbSystem.setGlobalKey("last_season_top_sultan", top_sultan)
    
    //dapetin top trader
    const top_traders = [...user_all_entries].sort(([id_1, data_1], [id_2, data_2]) => data_2.jumlah_trading - data_1.jumlah_trading).slice(0, 3)
    const top_trader = []
    top_traders.forEach(([id, _]) => top_trader.push(id))
    dbSystem.setGlobalKey("last_season_top_trader", top_trader)
    
    //tambah 3 bot super buat season baru
    await clearBotEffect("super")
    await addBotEffect("super", 3)
    
    //cari bot yang paling aktif
    const get_all_user_trader = user_all_entries.map(([k, v]) => v.jumlah_trading)
    let count_all = 0;
    get_all_user_trader.forEach((v) => count_all += v)
    const minimum_on = Math.floor(count_all / user_all_entries.length)
    const filter_aktif = user_all_entries.filter(([k, v], i) => v.jumlah_trading >= minimum_on)
    filter_aktif.forEach(([k, v]) => {
        user_all[k].aktif.last_season_aktif = true
        user_all[k].aktif.total_aktif += 1
    })
    dbSystem.saveUser()
    
    //reset semua user
    const item_reset = global_db.item_reset_season
    let user_obj
    for(let [_, data_user] of user_all_entries){
        user_obj = user_all[data_user.id]
        merge(user_obj, item_reset)
    }
    dbSystem.saveUser()
    
    //reset global db
    const item_global_reset = ["perak", "emas", "platinum", "diamond", "balaceCoin", "roadaCoin", "flagCoin", "timenCoin", "loyaliCoin"]
    item_global_reset.forEach((k) => {
        dbSystem.setGlobalKey(`${k}_volume.beli_genap`, 0)
        dbSystem.setGlobalKey(`${k}_volume.jual_genap`, 0)
        dbSystem.setGlobalKey(`${k}_volume.beli_ganjil`, 0)
        dbSystem.setGlobalKey(`${k}_volume.jual_ganjil`, 0)
    })
    
    //hapus semua party
    const party_aktif = Object.entries(global_db.party_on)
    party_aktif.forEach(([id, _], i) => {
        if(_.id <= 100) party_fc.delete_party(id)
    })
    
    //ubah data season
    dbSystem.addGlobalKey("season", 1)
    dbSystem.setGlobalKey("last_season", Date.now())
    
    console.log(c.blueBright("\n\n========================================"))
    console.log(c.blueBright(`Update new Season: ${global_db.season+1}`))
    console.log(c.blueBright(`new season at: ${moment().tz("Asia/Jakarta").format("DD/MM/YY HH:mm:ss")}`))
    console.log(c.blueBright(`top 3 sultan: ${top_sultan}`))
    console.log(c.blueBright("========================================"))
}

/*
async function wartowar(){
    const all_user = dbSystem.getAllUser()
    const all_user_entries = Object.entries(all_user)
    
    // fungsi random ambil 20 user buat war
    const bot_join_war = []
    while(bot_join_war.length <= 20){
        const random_take = Math.floor(Math.random() * all_user_entries.length)
        const id = Number(all_user_entries[random_take][0])
        if(bot_join_war.includes(id)) continue
        else bot_join_war.push(id)
    }
    
    //membagi perlawanan
    const bot_vs_1 = chunk(bot_join_war, 2)
    for(let [id_1, id_2] of bot_vs_1){
        let [hp_user_1, attack_user_1] = [all_user[id_1].rpg.health, all_user[id_1].rpg.attack]
        let [hp_user_2, attack_user_2] = [all_user[id_2].rpg.health, all_user[id_2].rpg.attack]
        
    }
}*/