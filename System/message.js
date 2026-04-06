const parser = require("uzi_telegram-parser")
const fs = require("fs")
const c = require("chalk")
const os = require("os")
const process = require("process")
const path = require("path")
const dbSystem = require("../lib/func_db.js")
const {
    formatNumber,
    getHargarata,
    getLogHistoryPerubahanHarga,
    sleep,
    reset_season
} = require("../lib/func_other.js")
const {
    randomBotTrading,
    updateBotName,
    addBotEffect,
    clearBotEffect
} = require("../lib/func_bot.js")
const {
    tempPerubahan
} = require("../lib/func_cointem.js")

module.exports = async (Client, m) => {
    try {
        if (Math.floor(Date.now()/1000) - m.date > 60) {
            console.log(c.red(`\nPesan lampau diabaikan!Detail:\nPengirim: ${m.from.first_name} || ${m.from.id}\nPesan: ${m.text || m.caption || "tanpa pesan"}`))
            return
        }


        await dbSystem.createDBUser("user", m)
        const fc = await parser.mParsing(Client, m)
        if (fc.chat_type !== "private" && fc.msg.text.startsWith("/"))return fc.replyMsg("Bot hanya bisa digunkanan pada private chat!")
        const args = fc.msg.text.split(" ").slice(1)
        const text = args.join(" ")
        const command = fc.msg.text.split(" ")[0].slice(1).toLowerCase()

        switch (command) {
            case "menu": {
                function getTime(t) {
                    t = parseInt(t)
                    let sisa,
                    hari,
                    jam,
                    menit,
                    detik
                    hari = parseInt(t / (1*24*60*60))
                    sisa = t % (1*24*60*60)
                    jam = Math.floor(sisa / (1*60*60))
                    sisa = sisa % (1*60*60)
                    menit = Math.floor(sisa / (1*60))
                    detik = sisa % 60

                    return `${hari > 0? hari+" hari ": ""}${jam > 0? jam+" jam ": ""}${menit > 0? menit+" menit ": ""} ${detik > 0? detik+" detik": ""}`
                }
                //dapetin info panel dan vps
                const [vpsUptime,
                    nodeUptime] = [os.uptime(),
                    process.uptime()]

                let teks = "===================="
                teks += "\nvps uptime: " + getTime(vpsUptime)
                teks += "\nserver uptime: " + getTime(nodeUptime)
                teks += "\n===================="
                teks += "\n---menu:"
                teks += "\n• /ping"
                teks += "\n• /money"
                teks += "\n• /tradingitem"
                teks += "\n• /tradingcoin"
                teks += "\n• /leaderboard"
                teks += "\n===================="

                Client.sendMessage(m.from.id, teks, {
                    reply_to_message_id: m.message_id,
                    entities: [{
                        offset: 0,
                        length: teks.length,
                        type: "pre"
                    }]
                })
            } break

            case "ping": {
                fc.replyMsg("Pong!\nBot masih on!")
            } break

            case "cekbot": {
                if (!args[0])return fc.replyMsg("Masukan id bot yang akan di cek!")

                const botId = Number(args[0])

                try {
                    const botDB = dbSystem.getUser(botId)

                    fc.replyMsg("Ini dia isi database dari "+ botId+":\n"+JSON.stringify(botDB, null, 4))
                } catch(e) {
                    fc.replyMsg("Bot tidak ada di dalam database!")
                }
            } break

            case "addbot": {
                if (!text)return fc.replyMsg("Masukan jumlah bot yang akan ditambah!")

                const jumlah = Number(args[0])
                for (let i = 0; i < jumlah; i++) {
                    dbSystem.createDBUser("bot")
                }

                fc.replyMsg("Berhasil membuat bot baru sebanyak "+jumlah)
            } break


            case "addbotsmart": {
                clearBotEffect("smart")
                const respon = await addBotEffect("smart", 5+dbSystem.getGlobalKey("season"))
                fc.replyMsg(respon)
            } break
            case "addbotfast": {
                clearBotEffect("fast")
                const respon = await addBotEffect("fast", 8)
                fc.replyMsg(respon)
            } break


            case "botreset": {
                if (args.length < 2)return

                const [key,
                    value,
                    type] = args
                const allDB = dbSystem.getAllUser()
                const keyDB = Object.keys(allDB)
                let berhasil = 0
                let gagal = 0

                for (let id of keyDB) {
                    if (!allDB[id].nama.includes("bot")) continue
                    try {
                        if (type === "string") dbSystem.setUserKey(id, key, value)
                        else if (type === "int") dbSystem.setUserKey(id, key, Number(value))
                        else if (type === "add") dbSystem.addUserKey(id, key, Number(value))
                        else if (type === "delete") dbSystem.deleteUserKey(id, key)
                        berhasil += 1
                    } catch {
                        gagal += 1
                        continue
                    }
                }

                Client.sendMessage(m.from.id, `Berhasil memproses reset ${key} menjadi ${value} pada semua bot.\nberhasil di reset: ${berhasil}\ngagal di reset: ${gagal}`)
            } break


            case "tradingitem": {
                const getPrice = await dbSystem.getGlobal()
                try {
                    var getUser = dbSystem.getUser(fc.sender.id)
                } catch {
                    await dbSystem.createDBUser("user", m)
                    var getUser = dbSystem.getUser(fc.sender.id)
                }

                let teks = "===================="
                teks += "\nperak: " + formatNumber(getPrice.hargaPerak) + ` (${tempPerubahan("perak")})`
                teks += "\nemas: " + formatNumber(getPrice.hargaEmas) + ` (${tempPerubahan("emas")})`
                teks += "\nplatinum: " + formatNumber(getPrice.hargaPlatinum) + ` (${tempPerubahan("platinum")})`
                teks += "\ndiamond: " + formatNumber(getPrice.hargaDiamond) + ` (${tempPerubahan("diamond")})`
                teks += "\n===== dimiliki ========"
                teks += "\nperak: " + formatNumber(getUser.perak)
                teks += "\nemas: " + formatNumber(getUser.emas)
                teks += "\nplatinum: " + formatNumber(getUser.platinum)
                teks += "\ndiamond: " + formatNumber(getUser.diamond)
                teks += "\n===================="

                Client.sendMessage(fc.from, teks, {
                    reply_to_message_id: fc.msg.id,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "beli", callback_data: "buyitem"
                            }, {
                                text: "jual", callback_data: "sellitem"
                            }],
                            [{
                                text: "cancel", callback_data: "cancel"
                            }]
                        ]
                    },
                    entities: [{
                        offset: 0,
                        length: teks.length,
                        type: "pre"
                    }]
                })
            } break

            case "tradingcoin": {
                const {
                    balaceCoin,
                    balaceChart,
                    roadaCoin,
                    roadaChart,
                    flagCoin,
                    flagChart,
                    timenCoin,
                    timenChart,
                    loyaliCoin,
                    loyaliChart
                } = dbSystem.getGlobal()

                const {
                    balaceCoin: balace,
                    roadaCoin: roada,
                    flagCoin: flag,
                    timenCoin: timen,
                    loyaliCoin: loyali
                } = dbSystem.getUser(fc.sender.id)

                //📉📈
                let teks = "==============================="
                teks += "\nbalaceCoin: "+formatNumber(balaceCoin)
                teks += "\nroadaCoin : "+formatNumber(roadaCoin)
                teks += "\nflagCoin  : "+formatNumber(flagCoin)
                teks += "\ntimenCoin : "+formatNumber(timenCoin)
                teks += "\nloyaliCoin: "+formatNumber(loyaliCoin)
                teks += "\n\n============ chart ============"
                teks += `\nbalaceCoin: [${balaceChart.join(", ").replace(/1/g, "📈").replace(/0/g, "📉")}]`
                teks += `\nroadaCoin : [${roadaChart.join(", ").replace(/1/g, "📈").replace(/0/g, "📉")}]`
                teks += `\nflagCoin  : [${flagChart.join(", ").replace(/1/g, "📈").replace(/0/g, "📉")}]`
                teks += `\ntimenCoin : [${timenChart.join(", ").replace(/1/g, "📈").replace(/0/g, "📉")}]`
                teks += `\nloyaliCoin: [${loyaliChart.join(", ").replace(/1/g, "📈").replace(/0/g, "📉")}]`
                teks += "\n\n=========== dimiliki ==========="
                teks += "\nbalaceCoin: "+formatNumber(balace)
                teks += "\nroadaCoin : "+formatNumber(roada)
                teks += "\nflagCoin  : "+formatNumber(flag)
                teks += "\ntimenCoin : "+formatNumber(timen)
                teks += "\nloyaliCoin: "+formatNumber(loyali)

                Client.sendMessage(fc.from, teks, {
                    reply_to_message_id: fc.msg.id,
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: "beli", callback_data: "buycoin"
                            }, {
                                text: "jual", callback_data: "sellcoin"
                            }],
                            [{
                                text: "cancel", callback_data: "cancel"
                            }]
                        ]
                    },
                    entities: [{
                        offset: 0,
                        length: teks.length,
                        type: "pre"
                    }]
                })
            } break

            case "lb":
            case "leaderboard": {
                    if (Date.now() - dbSystem.getGlobalKey("last_season") < 1*24*60*60*1000) {
                        Client.sendMessage(fc.from, "Leaderboard akan tersedia setelah 1 hari dari season")
                        return
                    }

                    Client.sendMessage(fc.from, "Pilih menu leaderboard", {
                        reply_to_message_id: fc.msg.id,
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: "sultan", callback_data: "leaderboard sultan"
                                }],
                                [{
                                    text: "top trader", callback_data: "leaderboard trader"
                                }],
                                [{
                                    text: "profit (daily)", callback_data: "leaderboard profit_daily"
                                }],
                                [{
                                    text: "profit high", callback_data: "leaderboard profit_high"
                                }],
                                [{
                                    text: "pekerjaan", callback_data: "leaderboard pekerjaan"
                                }],
                                [{
                                    text: "cancel", callback_data: "cancel"
                                }],
                            ]
                        }
                    })
                } break

            case "uang":
            case "money": {
                    Client.sendMessage(fc.from, `Uangmu: \n=> ${formatNumber(dbSystem.getUserKey(fc.from, "uang"))}`, {
                        reply_to_message_id: fc.msg.id
                    })
                } break

            case "total-trading": {
                Client.sendMessage(fc.from, `total trading mu: ${formatNumber(dbSystem.getUserKey(fc.from, "jumlah_trading"))}`, {
                    reply_to_message_id: fc.msg.id
                })
            } break

            case "season_new": {
                await reset_season()
                fc.replyMsg("Berhasil membuat season baru ("+(dbSystem.getGlobalKey("season")+1)+")!")
            } break

            case "backup": {
                await Client.sendDocument(fc.from, path.join(process.cwd(), "database", "user.json"), {
                    caption: "Berikut adalah backup user.json",
                    reply_to_message_id: m.message_id
                })

                await Client.sendDocument(fc.from, path.join(process.cwd(), "database", "global.json"), {
                    caption: "Berikut adalah backup global.json",
                    reply_to_message_id: m.message_id
                })
            } break

            case "getlog": {
                getLogHistoryPerubahanHarga(Client, fc, args[0])
            } break

            case "kerja": {
                const user = await dbSystem.getUser(fc.sender.id)

                if (user.pekerjaan.pekerjaan === "pengangguran") {
                    const send = await Client.sendMessage(fc.from, "Kamu masih pengangguran!")

                    const job_list_can_you_do = Object.entries(await dbSystem.getGlobalKey("pekerjaan")).filter(([k, v], i) => user.pekerjaan.pengalaman >= v[0].minimum)
                    await sleep(2)
                    const toDoList = []
                    for (let [key, value] of job_list_can_you_do) {
                        toDoList.push([{
                            text: value[0].pekerjaan, callback_data: "lamar_pekerjaan "+value[0].pekerjaan
                        }])
                    }
                    const listed = job_list_can_you_do.map(([k, v], i) => {
                        return `pekerjaan: ${v[0].pekerjaan}\ngaji: ${v[0].gaji}\nminimun pengalaman: ${v[0].pengalaman}\ncooldown: ${v[0].cooldown}s`
                    }).join("\n\n")
                    const new_message = `Kamu belum memiliki pekerjaan!\n\nPilih pekerjaan dibawah!\n${listed}`
                    Client.editMessageText(new_message, {
                        reply_markup: {
                            inline_keyboard: [
                                ...toDoList
                            ]
                        },
                        chat_id: send.chat.id,
                        message_id: send.message_id
                    })
                } else {
                    const now = Math.floor(Date.now()/1000)
                    const user_kerja = user.pekerjaan
                    const data_kerjaan = dbSystem.getGlobalKey("pekerjaan."+user_kerja.pekerjaan)[0]

                    if (now - user_kerja.last_kerja <= data_kerjaan.cooldown)return fc.replyMsg("Kamu sudah bekerja! Coba lagi nanti...")

                    let gaji = 0
                    if (["pedagang", "pembisnis", "ceo"].includes(user_kerja.pekerjaan)) {
                        const untung = Math.random() > 0.25
                        const close = Math.random() < 0.1
                        gaji = Math.floor(Math.random() * data_kerjaan.gaji)
                        if (!untung) {
                            gaji *= -1
                            fc.replyMsg("Kamu mengalani kerugian hingga mencapai "+gaji)
                        }
                        if (close) {
                            dbSystem.setUserKey(fc.sender.id, "pekerjaan.pekerjaan", "pengangguran")
                            fc.replyMsg("Kamu bangkrut hingga berhenti menjadi "+kerja.pekerjaan)
                        }

                    } else {
                        const dipecat = Math.random() < 0.15
                        gaji = data_kerjaan.gaji + Math.round(Math.random() * (data_kerjaan.gaji * 0.03))
                        if (dipecat) {
                            dbSystem.setUserKey(fc.sender.id, "pekerjaan.pekerjaan", "pengangguran")
                            fc.replyMsg("Kamu dipecat dari pekerjaan mu!")
                        }
                    }

                    fc.replyMsg("Kamu mendapatkan uang sebanyak "+gaji+" hasil dari kerjamu!")
                    dbSystem.setUserKey(fc.sender.id, `pekerjaan.last_kerja`, now)
                    dbSystem.addUserKey(fc.sender.id, "uang", gaji)
                    dbSystem.addUserKey(fc.sender.id, `pekerjaan.pengalaman`, 1)
                }
            } break
            
            case "cekparty": {
                if(!args[0]) return fc.replyMsg("Masukan id party yang ingin di cek!")
                
                const party_id = Number(args[0])
                const party_data = await dbSystem.getGlobalKey("party_on."+party_id)
                if(!party_data || !party_data.id) return fc.replyMsg("Party dgn id itu tidak ditemukan!")
                else {
                    const {id, member, type} = party_data
                    const sisa_waktu = party_data.waktu_limit - (Math.floor(Date.now()/60000) - party_data.waktu_mulai)
                    fc.replyMsg(`Berikut adalah detail dari party yang kamu cari!\n=> id: ${id}\n=> member: ${member}\n=> type: ${type}\n=> sisa waktu: ${sisa_waktu}`)
                }
            } break
            
            case "slot": {
                const [nominal] = args
                if(!nominal)return fc.replyMsg("Masukan nominal!")
                const [r1, r2, r3] = [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)]
                
                
                if((r1 === r2) && (r2 === r3)){
                    fc.replyMsg("Kamu Win SLOT!!! nominal *2")
                    dbSystem.addUserKey(fc.sender.id, "uang", nominal*2)
                } else {
                    fc.replyMsg("Kamu GAGAL! MONEY -NOMINAL!!")
                    dbSystem.addUserKey(fc.sender.id, "uang", -nominal)
                }
            } break
        }
    } catch(e) {
        console.log(e)
    }
}