const fs = require("fs")
const c = require("chalk")
const merge = require("lodash.merge")
const mergeWith = require("lodash.mergewith")
const process = require("process")

class dbSystem {
    static dbUser = JSON.parse(fs.readFileSync(process.cwd()+"/database/user.json"))
    static dbGlobal = JSON.parse(fs.readFileSync(process.cwd()+"/database/global.json"))

    static loadDB() {
        dbSystem.dbUser = JSON.parse(fs.readFileSync(process.cwd()+"/database/user.json"))
        dbSystem.dbGlobal = JSON.parse(fs.readFileSync(process.cwd()+"/database/global.json"))
    }

    static getAllUser() {
        return dbSystem.dbUser
    }

    static getUser(id) {
        if (!dbSystem.dbUser[id]) throw new Error("Database user tidak ditemukan!")
        else return dbSystem.dbUser[id]
    }

    static getUserKey(id, key) {
        const keys = key.split(".")
        let objTemp = dbSystem.dbUser[id]

        for (let i = 0; i < keys.length; i++) {
            objTemp = objTemp[keys[i]]
        }

        return objTemp
    }

    static addUserKey(id, key, value) {
        const keys = key.split(".")
        let obj = dbSystem.dbUser[id]

        for (let i = 0; i < keys.length-1; i++) {
            obj = obj[keys[i]]
        }

        obj[keys[keys.length-1]] = (obj[keys[keys.length-1]] || 0) + value
        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(dbSystem.dbUser, null, 4))
    }

    static setUserKey(id, key, value) {
        const keys = key.split(".")
        let obj = dbSystem.dbUser[id]

        for (let i = 0; i < keys.length-1; i++) {
            obj = obj[keys[i]]
        }

        obj[keys[keys.length-1]] = value
        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(dbSystem.dbUser, null, 4))
    }
    
    static updateUser(id, obj_update){
        function checking(data_lama, data_baru){
            if(Array.isArray(data_lama)) return data_lama.concat(data_baru)
            if(typeof data_baru === "string" && data_baru.split(" ")[0] === "add") return data_lama+Number(data_baru.split(" ")[1])
        }
        
        //console.log("\nid: "+id)
        //console.log(JSON.stringify(obj_update, null, 4))
        const db_user = dbSystem.dbUser[id]
        mergeWith(db_user, obj_update, checking)
        
        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(dbSystem.dbUser, null, 4))
    }
    
    static saveUser(){
        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(dbSystem.dbUser, null, 4))
    }

    static deleteUserKey(id, key) {
        const keys = key.split(".")
        let obj = dbSystem.dbUser[id]

        for (let i = 0; i < keys.length-1; i++) {
            obj = obj[keys[i]]
        }

        delete obj[keys[keys.length-1]]

        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(dbSystem.dbUser, null, 4))
    }

    static getGlobal() {
        return dbSystem.dbGlobal
    }

    static getGlobalKey(key) {

        const keys = key.split(".")
        let obj = dbSystem.dbGlobal

        for (let i = 0; i < keys.length; i++) {
            obj = obj[keys[i]]
        }
        return obj
    }

    static addGlobalKey(key, value) {
        const keys = key.split(".")
        let obj = dbSystem.dbGlobal

        for (let i = 0; i < keys.length-1; i++) {
            obj = obj[keys[i]]
        }

        obj[keys[keys.length-1]] = (obj[keys[keys.length-1]] || 0) + value
        fs.writeFileSync(process.cwd()+"/database/global.json", JSON.stringify(dbSystem.dbGlobal, null, 4))
    }

    static setGlobalKey(key, value) {
        const keys = key.split(".")
        let obj = dbSystem.dbGlobal

        for (let i = 0; i < keys.length-1; i++) {
            obj = obj[keys[i]]
        }

        obj[keys[keys.length-1]] = value
        fs.writeFileSync(process.cwd()+"/database/global.json", JSON.stringify(dbSystem.dbGlobal, null, 4))
    }
    
    static updateGlobal(obj_update){
        function checking(data_lama, data_baru){
            if(Array.isArray(data_lama)) return data_lama.concat(data_baru)
            if(typeof data_baru === "string" && data_baru.split(" ")[0] === "add") return data_lama+Number(data_baru.split(" ")[1])
        }
        
        const db_global = dbSystem.dbGlobal
        mergeWith(db_global, obj_update, checking)
        
        fs.writeFileSync(process.cwd()+"/database/global.json", JSON.stringify(dbSystem.dbGlobal, null, 4))
    }
    
    static deleteGlobalKey(key){
        const keys = key.split(".")
        let obj = dbSystem.dbGlobal
        
        for(let i = 0; i < keys.length-1; i++){
            if(!obj[keys[i]]) throw new Error("Error keys ("+keys[i]+") tidak ada di Object!")
            else obj = obj[keys[i]]
        }
        
        delete obj[keys[keys.length-1]]
        fs.writeFileSync(process.cwd()+"/database/global.json", JSON.stringify(dbSystem.dbGlobal, null, 4))
    }
    
    
    static getAllDB(){
        return [dbSystem.dbGlobal, dbSystem.dbUser]
    }

    //buat db
    static async createDBUser(type, data) {
        const readDB = dbSystem.getAllUser()
        let nama, id, idObj
        
        if (type == "bot") {
            let toKey = Object.keys(readDB)
            .map((k) => {
                if (!dbSystem.getUserKey(k, "nama").includes("bot"))return
                else return k
            })
            nama = "bot-"+(toKey.length+1)
            id = data || toKey.length+1
        } else {
            nama = data.from.username || data.from.first_name || "undefined name"
            id = data.from.id
        }

        const def = {
            nama: nama,
            id: id,
            type: nama.includes("bot") ? "bot": "user",
            role: "normal",
            party_id: 0,
            points: 0,
            profit: {
                perak: 0,
                perak_modal: 0,
                emas: 0,
                emas_modal: 0,
                platinum: 0,
                platinum_modal: 0,
                diamond: 0,
                diamond_modal: 0,
                balaceCoin: 0,
                balaceCoin_modal: 0,
                roadaCoin: 0,
                roadaCoin_modal: 0,
                flagCoin: 0,
                flagCoin_modal: 0,
                timenCoin: 0,
                timenCoin_modal: 0,
                loyaliCoin: 0,
                loyaliCoin_modal: 0
            },
            total_profit: 0,
            high_profit: 0,
            
            uang: 100,
            perak: 0,
            emas: 0,
            platinum: 0,
            diamond: 0,
            
            balaceCoin: 0,
            roadaCoin: 0,
            flagCoin: 0,
            timenCoin: 0,
            loyaliCoin: 0,
            
            jumlah_trading: 0,
            lastHarga: 0,
            skip_transaksi: 0,
            
            pekerjaan: {
                pekerjaan: "pengangguran",
                pengalaman: 0,
                last_kerja: 0,
            },
            
            rpg_war: {
                attack: 5,
                health: 10,
                win: 0,
                lose: 0,
            },
            
            kejahatan: {
                tutup_mulut: false,
                penjara: false,
                penjara_time: 0,
                penjara_start: 0
            },
            
            aktif: {
                last_season_aktif: false,
                total_aktif: 0
            }
        }
        
        const merge_user = merge({}, def, readDB[id])
        readDB[id] = merge_user
        fs.writeFileSync(process.cwd()+"/database/user.json", JSON.stringify(readDB, null, 4))
        await dbSystem.loadDB()
        return dbSystem.getUser(id)
    }

    static async createDBGlobal() {
        let readDB = dbSystem.getGlobal()

        const def = {
            season: 0,
            item_reset_season: {
                uang: 300,
                party_id: 0,
                profit: {
                    perak: 0,
                    perak_modal: 0,
                    emas: 0,
                    emas_modal: 0,
                    platinum: 0,
                    platinum_modal: 0,
                    diamond: 0,
                    diamond_modal: 0,
                    balaceCoin: 0,
                    balaceCoin_modal: 0,
                    roadaCoin: 0,
                    roadaCoin_modal: 0,
                    flagCoin: 0,
                    flagCoin_modal: 0,
                    timenCoin: 0,
                    timenCoin_modal: 0,
                    loyaliCoin: 0,
                    loyaliCoin_modal: 0
                },
                total_profit: 0,
                perak: 0,
                emas: 0,
                platinum: 0,
                diamond: 0,
            
                balaceCoin: 0,
                roadaCoin: 0,
                flagCoin: 0,
                timenCoin: 0,
                loyaliCoin: 0,
                pekerjaan: {
                    pekerjaan: "pengangguran",
                    pengalaman: 0,
                    last_kerja: 0,
                },
                jumlah_trading: 0,
                lastHarga: 0,
                skip_transaksi: 0
            },
            last_season: Date.now(),
            last_season_top_sultan: [],
            last_season_top_trader: [],
            hargaPerak: 0,
            hargaEmas: 0,
            hargaPlatinum: 0,
            hargaDiamond: 0,
            
            balaceCoin: 0,
            balaceChart: [],
            roadaCoin: 0,
            roadaChart: [],
            flagCoin: 0,
            flagChart: [],
            timenCoin: 0,
            timenChart: [],
            loyaliCoin: 0,
            loyaliChart: [],
            
            perak_volume: {
                beli_genap: 0,
                jual_genap: 0,
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            emas_volume: {
                beli_genap: 0,
                jual_genap: 0,
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            platinum_volume: {
                beli_genap: 0,
                jual_genap: 0,
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            diamond_volume: {
                beli_genap: 0,
                jual_genap: 0,
                beli_ganjil: 0,
                jual_ganjil: 0
            },
            balaceCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
                beli_genap: 0,
                jual_genap: 0,
            },
            roadaCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
                beli_genap: 0,
                jual_genap: 0,
            },
            flagCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
                beli_genap: 0,
                jual_genap: 0,
            },
            timenCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
                beli_genap: 0,
                jual_genap: 0,
            },
            loyaliCoin_volume: {
                beli_ganjil: 0,
                jual_ganjil: 0,
                beli_genap: 0,
                jual_genap: 0,
            },

            pekerjaan: {
                pengangguran: [{
                    pekerjaan: "pengangguran",
                    gaji: -5,
                    minimum: 0,
                    cooldown: 0
                }],
                ojek: [{
                    pekerjaan: "ojek",
                    gaji: 5,
                    minimum: 0,
                    cooldown: 10*60
                }],
                guru: [{
                    pekerjaan: "guru",
                    gaji: 8,
                    minimum: 5,
                    cooldown: 8*60
                }],
                ob: [{
                    pekerjaan: "ob",
                    gaji: 10,
                    minimum: 8,
                    cooldown: 10*60
                }],
                karyawan_swasta: [{
                    pekerjaan: "karyawan_swasta",
                    gaji: 15,
                    minimum: 15,
                    cooldown: 10*60
                }],
                karyawan_negeri: [{
                    pekerjaan: "karyawan_negeri",
                    gaji: 18,
                    minimum: 20,
                    cooldown: 7*60
                }],
                tambang: [{
                    pekerjaan: "tambang",
                    gaji: 100,
                    minimum: 30,
                    cooldown: 23*60
                }],
                pedagang: [{
                    pekerjaan: "pedagang",
                    gaji: 120,
                    minimum: 50,
                    cooldown: 20*60
                }],
                pembisnis: [{
                    pekerjaan: "pembisnis",
                    gaji: 200,
                    minimum: 80,
                    cooldown: 25*60
                }],
                ceo: [{
                    pekerjaan: "ceo",
                    gaji: 500,
                    minimum: 250,
                    cooldown: 20*60
                }],
            },
            party_on: {
                def: {
                    id: 999,
                    member: [],
                    type: "",
                    waktu_limit: 0,
                    waktu_mulai: 0
                },
                def_borongan: {
                    id: 1000,
                    member: [],
                    type: "",
                    waktu_limit: 0,
                    waktu_mulai: 0,
                    beli_waktu: "", //genap/ganjil
                    beli_barang: ""
                }
            },
            party_data: {
                max_member: 7,
                type: ["fast", "diskon", "smart", "borongan"],
                waktu_limit: 0,
                waktu_mulai: 0
            },
        }
        
        const gabung = merge(def, readDB)
        console.log(c.blueBright("Update db global succes"))
        fs.writeFileSync(process.cwd()+"/database/global.json", JSON.stringify(gabung, null, 4))
        await dbSystem.loadDB()
    }
}

module.exports = dbSystem