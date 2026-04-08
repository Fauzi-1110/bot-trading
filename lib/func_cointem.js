const dbSystem = require("./func_db.js")
const moment_tz = require("moment-timezone")
const {
    addHistoryPerubahanHarga
} = require("./func_other.js")
/*
const { randItem,
    randCoin
} = require("./func_cointem")
*/
module.exports = {
    randItem,
    randCoin,
    buyVolume,
    sellVolume,
    reset_volume,
    tempPerubahan
}

const last_buy = {}
const last_sell = {}

//fungsi update volume baru
function update_volume(item_name, jumlah, aksi) {
    const now = Math.floor(Date.now()/60000)
    const isSame = (aksi === "beli" && last_buy[item_name] === now) || (aksi === "jual" && last_sell[item_name] === now)
    let stringUpdate = ""
    let periode = ""

    if (aksi !== "beli" && aksi !== "jual")throw new Error("Aksi tidak valid!")
    if (now % 2 === 0) periode = "genap"
    else periode = "ganjil"
    stringUpdate = `${item_name}_volume.${aksi}_${periode}`

    dbSystem.addGlobalKey(stringUpdate, jumlah)
}

//fungsi pemanggulan buay uodate
function buyVolume (item_name, jumlah) {
    update_volume(item_name, jumlah, "beli")
}
function sellVolume(item_name, jumlah) {
    update_volume(item_name, jumlah, "jual")
}

function reset_volume() {
    const now = Math.floor(Date.now()/60000)
    let up

    if (now % 2 === 0) {
        up = {
            perak_volume: { beli_genap: 0, jual_genap: 09 },
            emas_volume: { beli_genap: 0, jual_genap: 0 },
            platinum_volume: { beli_genap: 0, jual_genap: 0, },
            diamond_volume: { beli_genap: 0, jual_genap: 0, },
            balaceCoin_volume: { beli_genap: 0, jual_genap: 0, },
            roadaCoin_volume: { beli_genap: 0, jual_genap: 0, },
            flagCoin_volume: { beli_genap: 0, jual_genap: 0, },
            timenCoin_volume: { beli_genap: 0, jual_genap: 0, },
            loyaliCoin_volume: { beli_genap: 0, jual_genap: 0, }
        }
    } else {
        up = {
            perak_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            emas_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            platinum_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            diamond_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            balaceCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
            },
            roadaCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
            },
            flagCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
            },
            timenCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
            },
            loyaliCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
            }
        }
    }
    
    dbSystem.updateGlobal(up)
}

//semnetara
function tempPerubahan(nama) {
    const now = Math.floor(Date.now()/60000)
    let volume_beli,
    volume_jual,
    pengaruh
    if (now % 2 === 0) {
        volume_beli = dbSystem.getGlobalKey(`${nama}_volume.beli_ganjil`)
        volume_jual = dbSystem.getGlobalKey(`${nama}_volume.jual_ganjil`)
    } else {
        volume_beli = dbSystem.getGlobalKey(`${nama}_volume.beli_genap`)
        volume_jual = dbSystem.getGlobalKey(`${nama}_volume.jual_genap`)
    }
    pengaruh = Math.floor((volume_beli - volume_jual) * 0.5)

    return pengaruh
}

function randItem() {
    async function gantiHarga(nama, Gitem, min, max) {
        /*
        min = 20
        max = 40
        now = 34
        scope = 40 - 20 = 20
        harga range = 34 - 20 = 14
        persen = 14 / 20 = 0,7
        persenNum = 0,7 * 100 = 70
        */
        const nowPrice = dbSystem.getGlobalKey(Gitem)
        const scope = max-min
        let hargaRange = nowPrice - min
        const persen = hargaRange/scope
        const persenNum = persen*100

        //dapetin berbagai opsi untuk perubahan hargga
        let effect_posisi_1,
        effect_posisi_2,
        effect_volume,
        effect_random
        effect_posisi_2 = 0


        //dari posisi dekat dengan min/max
        if (persenNum <= 15) effect_posisi_1 = Math.ceil(Math.random() * 3) + 2
        else if (persenNum >= 90) effect_posisi_1 = -(Math.ceil(Math.random() * 3) + 2)
        else effect_posisi_1 = 0

        //dari volume
        const now = Math.floor(Date.now()/60000)
        let volume_beli,
        volume_jual,
        pengaruh
        if (now % 2 === 0) {
            volume_beli = await dbSystem.getGlobalKey(`${nama}_volume.beli_genap`)
            volume_jual = await dbSystem.getGlobalKey(`${nama}_volume.jual_genap`)
        } else {
            volume_beli = await dbSystem.getGlobalKey(`${nama}_volume.beli_ganjil`)
            volume_jual = await dbSystem.getGlobalKey(`${nama}_volume.jual_ganjil`)
        }
        pengaruh = Math.floor((volume_beli - volume_jual) * 0.5)
        if (pengaruh >= 500) effect_volume = Math.floor(Math.random() * 3) + 5
        else if (pengaruh <= -500) effect_volume = -(Math.floor(Math.random() * 3) + 5)
        else {
            effect_volume = Math.round(Math.random() * (Math.abs(pengaruh) * 0.01))
            if (Math.random() < 0.5) effect_volume *= -1
        }

        //dari random
        const naik = Math.random() > 0.5
        effect_random = Math.round(Math.random() * 3)
        if (!naik) effect_random *= -1

        const total_effect = effect_posisi_1 + effect_posisi_2 + effect_volume + effect_random
        let tarif_perubahan = Math.floor(nowPrice * (Math.abs(total_effect) / 100))
        if (total_effect < 0) tarif_perubahan *= -1

        if (nowPrice + tarif_perubahan <= 0) dbSystem.setGlobalKey(Gitem, min)
        else dbSystem.addGlobalKey(Gitem, tarif_perubahan)

        const sendToHistory = {
            harga_saat_ini: nowPrice,
            harga_terbaru: dbSystem.getGlobalKey(Gitem),
            effect_posisi_1: effect_posisi_1,
            effect_posisi_2: effect_posisi_2,
            effect_volume: effect_volume,
            effect_random: effect_random,
            total_effect: total_effect,
            tarif_perubahan: tarif_perubahan
        }
        addHistoryPerubahanHarga(sendToHistory, nama)
    }

    const itemList = [
        { 
            nama: "perak", Gitem: "hargaPerak",
            min: 120, max: 300
        },
        {
            nama: "emas",
            Gitem: "hargaEmas",
            min: 450,
            max: 800
        },
        {
            nama: "platinum",
            Gitem: "hargaPlatinum",
            min: 1200,
            max: 2600
        },
        {
            nama: "diamond",
            Gitem: "hargaDiamond",
            min: 3000,
            max: 5000
        },
    ]

    itemList.forEach((k) => gantiHarga(k.nama, k.Gitem, k.min, k.max))
}

async function randCoin() {
    const global_data = dbSystem.getGlobal()
    const min = 100000
    const max = 1000000
    const coin_list = ["balaceCoin", "roadaCoin", "flagCoin", "timenCoin", "loyaliCoin"]
    const pola_list = [
        {
            pola: ["0", "0", "0", "0", "0"]
            hasil: "naik", max: 8, min: 5
        }
        {
            pola: ["0", "0", "1", "0", "0"]
            hasil: "naik", max: 6, min: 3
        }
        {
            pola: ["0", "1", "0", "1", "0"]
            hasil: "turun", max: 5, min: 2
        }
        {
            pola: ["1", "1", "1", "1", "1"]
            hasil: "turun", max: 8, min: 5
        }
        {
            pola: ["1", "1", "0", "1", "1"]
            hasil: "turun", max: 6, min: 3
        }
        {
            pola: ["1", "0", "1", "0", "1"]
            hasil: "turun", max: 5, min: 2
        }
    ]
    
    
    for(let coin_name of coin_list){
        let e_volume, e_chart, e_waktu, e_random
        
        //event volume
        let volume_beli, volume_jual, pengaruh
        if( Math.floor(Date.now() / 60000) % 2 === 0){
            volume_beli = global_data[coin_name+"_volume"].beli_genap
            volume_jual = global_data[coin_name+"_volume"].jual_genap
        } else {
            volume_beli = global_data[coin_name+"_volume"].beli_genap
            volume_jual = global_data[coin_name+"_volume"].jual_genap
        }
        pengaruh = volume_beli - volume_jual
        if(pengaruh >= 300 || pengaruh <= -300) e_volume= Math.floor(Math.random() * 3) + 3
        if(pengaruh <= -300) e_volume *= -1
        if(!e_volume) e_volume = Math.floor(Math.random() * 2)+1
        
        //dari pola
        let pola_take = null
        const chart_pola = global_data[coin_name.replace("Coin", "Chart")]
        // --loop semua pola buat disamakan
        for(let data_pola of pola_list){
            // every buat memastikaj sem7a pila sama
            if(data_pola.pola.every((v, i) => v === chart_pola[i])) break pola_take = data_pola
        }
        if(pola_take){
            if(pola_take.hasil === "naik") e_chart = Math.floor(Math.random() * (pola_take.max - pola_take.min)) + pola_take.min
            else e_chart = -(Math.floor(Math.random() * (pola_take.max - pola_take.min)) + pola_take.min)
        } else e_chart = 0
    }
    
    
    
    /*
    function updateChart(chartBaru, chartName) {
        const chartLama = dbSystem.getGlobalKey(chartName) || []
        if (chartLama.length < 5) chartLama.push(chartBaru)
        else {
            chartLama.shift()
            chartLama.push(chartBaru)
        }
        dbSystem.setGlobalKey(chartName, chartLama)
    }

    const list_coin = ["balaceCoin", "roadaCoin", "flagCoin", "timenCoin", "loyaliCoin"]
    const chartPola = [
        {
            pola: ["1", "1", "0", "1","1"],
            max: 6,
            min: 3,
            kondisi: "turun"
        },
        {
            // pola 2
            pola: ["1", "1", "1", "1", "1"],
            max: 10,
            min: 5,
            kondisi: "turun"
        },
        {
            // pola 3
            pola: ["0", "0", "0", "0", "0"],
            max: 10,
            min: 5,
            kondisi: "naik",
        },
        {
            // pola 4
            pola: ["0", "0", "1", "0", "0"],
            max: 6,
            min: 3,
            kondisi: "naik",
        },
        {
            pola: ["1", "0", "1", "0", "1"],
            max: 5,
            min: 3,
            kondisi: "turun",
        },
        {
            pola: ["0", "1", "0", "1", "0"],
            max: 5,
            min: 3,
            kondisi: "naik",
        },
    ]

    for (let coin_name of list_coin) {
        let e_volume, e_chart, e_random, e_waktu
        const coin_chart = await dbSystem.getGlobalKey(coin_name.replace("Coin", "Chart"))

        //pengecekan alur dari volume
        const now = Math.floor(Date.now() / 60000)
        let chart_volume_buy,
        chart_volume_sell,
        pengaruh
        if (now % 2 === 0) {
            chart_volume_buy = await dbSystem.getGlobalKey(`${coin_name}_volume.beli_genap`)
            chart_volume_sell = await dbSystem.getGlobalKey(`${coin_name}_volume.jual_genap`)
        } else {
            chart_volume_buy = await dbSystem.getGlobalKey(`${coin_name}_volume.beli_ganjil`)
            chart_volume_sell = await dbSystem.getGlobalKey(`${coin_name}_volume.jual_ganjil`)
        }
        pengaruh = Math.floor(chart_volume_buy - chart_volume_sell) * 0.5
        if (pengaruh > 300 || pengaruh < -300) {
            e_volume = Math.floor(Math.random() * 5) + 3
            if (pengaruh < -300) e_volume *= -1
        } else {
            e_volume = Math.ceil(Math.random() * 2)
            if (Math.random() < 0.4) e_volume *= -1
        }

        //pengcekan dari chart
        let loop,
        data_chart_pola
        //fungsi cari index yang sama
        for (let data_pola of chartPola) {
            if (!loop) loop = 0
            const pola = data_pola.pola
            if (pola.every((k, i) => k === coin_chart[i])) {
                break
            }
            loop += 1
        }
        if (loop <= chartPola.length-1) {
            data_chart_pola = chartPola[loop]
            e_chart = Math.floor(Math.random() * (data_chart_pola.max - data_chart_pola.min)) + data_chart_pola.min
            if (data_chart_pola.kondisi === "turun") e_chart *= -1
        } else {
            e_chart = Math.ceil(Math.random() * 2)
            if (Math.random() < 0.4) e_chart *= -1
        }

        //pengecekan dari waktu
        const jam = Number(moment_tz().tz("Asia/Jakarta").format("HH"))
        if (jam > 20 && jam < 4) {
            e_waktu = Math.ceil(Math.random() * 3) * 2
            if (Math.random() < 0.5) e_waktu *= -1
        } else e_waktu = 0

        // pengecekan dari random
        const naik = Math.random() > 0.5
        e_random = Math.round(Math.random() * 3)
        if (!naik) e_random *= -1

        const total_persen = e_volume + e_chart + e_waktu + e_random
        const harga_sekarang = dbSystem.getGlobalKey(coin_name)
        let tambah = Math.ceil(harga_sekarang * (Math.abs(total_persen) / 100))
        if (total_persen < 0) tambah *= -1

        if (harga_sekarang + tambah <= 50) dbSystem.setGlobalKey(coin_name, 150)
        else dbSystem.addGlobalKey(coin_name, tambah)

        const forhs = {
            e_volume: e_volume,
            e_chart: e_chart,
            e_waktu: e_waktu,
            e_random: e_random,
            total_efek: total_persen,
            harga_lama: harga_sekarang,
            harga_baru: harga_sekarang + tambah,
            naik: tambah
        }
        addHistoryPerubahanHarga(forhs, coin_name)
    }*/
}