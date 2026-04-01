const dbSystem = require("../lib/func_db.js")
const parser = require("uzi_telegram-parser")
const {
    formatNumber,
    getHargarata
} = require("../lib/func_other.js")
const {
    buyVolume,
    sellVolume
} = require("../lib/func_cointem.js")

module.exports = async (Client, q) => {
    try {
        const qfc = await parser.qParsingSimple(q)

        Client.answerCallbackQuery(qfc.query.id)
        const all = qfc.query.data
        const args = all.split(" ").slice(1)
        const text = args.join(" ")
        const command = all.split(" ")[0]

        switch (command) {
            case "cancel": {
                Client.editMessageReplyMarkup({
                    inline_keyboard: []
                }, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id
                })
            } break

            case "buyitem": {
                Client.editMessageReplyMarkup({
                    inline_keyboard: [
                        [{
                            text: "perak", callback_data: "buyPerak"
                        }],
                        [{
                            text: "emas", callback_data: "buyEmas"
                        }],
                        [{
                            text: "platinum", callback_data: "buyPlatinum"
                        }],
                        [{
                            text: "diamond", callback_data: "buyDiamond"
                        }],
                    ]
                }, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id
                })
            } break

            case "buyPerak":
            case "buyEmas":
            case "buyPlatinum":
            case "buyDiamond": {
                    if (!text) {
                        Client.editMessageReplyMarkup({
                            inline_keyboard: [
                                [{
                                    text: "1", callback_data: `${command} 1`
                                }],
                                [{
                                    text: "10", callback_data: `${command} 10`
                                }],
                                [{
                                    text: "100", callback_data: `${command} 100`
                                }],
                                [{
                                    text: "1000", callback_data: `${command} 1000`
                                }],
                                [{
                                    text: "all", callback_data: `${command} all`
                                }],
                                [{
                                    text: "cancel", callback_data: "cancel"
                                }],
                            ]
                        }, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id
                        })

                        return
                    } else {
                        const itemName = ["harga"+command.split("buy")[1],
                            command.split("buy")[1].toLowerCase()]
                        const hSatu = dbSystem.getGlobalKey(itemName[0])
                        const jumlah = Number(args[0]) || Math.floor(dbSystem.getUserKey(qfc.clicker.id, "uang")/hSatu)
                        const totalHarga = hSatu*jumlah

                        if (jumlah < 0 || dbSystem.getUserKey(qfc.clicker.id, "uang") < totalHarga)return Client.editMessageText("Gagal melakukan transaksi (karena uang kurang/jumlah < 0)", {
                            chat_id: qfc.clicker.id, message_id: qfc.msg.id, reply_markup: {
                                inline_keyboard: []}})
                        if (["perak", "emas", "platinum", "diamond"].includes(itemName[1])) buyVolume(itemName[1], jumlah)
                        dbSystem.setUserKey(qfc.clicker.id, "lastHarga", hSatu)
                        dbSystem.addUserKey(qfc.clicker.id, itemName[1], jumlah)
                        dbSystem.addUserKey(qfc.clicker.id, "uang", -totalHarga)

                        //tambah ke total modal
                        dbSystem.addUserKey(qfc.clicker.id, `profit.${itemName[1]}_modal`, totalHarga)

                        Client.editMessageText(`Berhasil melakuka pembelian!\nItem: ${itemName[1]}\nJumlah: ${formatNumber(jumlah)}\nTotal Harga: ${formatNumber(totalHarga)}`, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id,
                            reply_markup: {
                                inline_keyboard: []
                            },
                            entities: [{
                                offset: 0,
                                length: "Berhasil melakuka pembelian!".length,
                                type: "bold"
                            }]
                        })
                    }
                } break

            case "sellitem": {
                Client.editMessageReplyMarkup({
                    inline_keyboard: [
                        [{
                            text: "perak", callback_data: "sellPerak"
                        }],
                        [{
                            text: "emas", callback_data: "sellEmas"
                        }],
                        [{
                            text: "platinum", callback_data: "sellPlatinum"
                        }],
                        [{
                            text: "diamond", callback_data: "sellDiamond"
                        }],
                    ]
                }, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id
                })
            } break

            case "sellPerak":
            case "sellEmas":
            case "sellPlatinum":
            case "sellDiamond": {
                    if (!text) {
                        Client.editMessageReplyMarkup({
                            inline_keyboard: [
                                [{
                                    text: "1", callback_data: `${command} 1`
                                }],
                                [{
                                    text: "10", callback_data: `${command} 10`
                                }],
                                [{
                                    text: "100", callback_data: `${command} 100`
                                }],
                                [{
                                    text: "1000", callback_data: `${command} 1000`
                                }],
                                [{
                                    text: "all", callback_data: `${command} all`
                                }],
                                [{
                                    text: "cancel", callback_data: "cancel"
                                }],
                            ]
                        }, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id
                        })

                        return
                    } else {
                        const itemName = ["harga"+command.split("sell")[1],
                            command.split("sell")[1].toLowerCase()]
                        const hSatu = dbSystem.getGlobalKey(itemName[0])
                        const jumlah = Number(args[0]) || dbSystem.getUserKey(qfc.clicker.id, itemName[1])
                        const totalHarga = hSatu*jumlah

                        if (jumlah <= 0 || dbSystem.getUserKey(qfc.clicker.id, itemName[1]) < jumlah)return Client.editMessageText("Gagal melakukan penjualan! (jumlah <= 0 atau barang dimiliki kurang)", {
                            chat_id: qfc.clicker.id, message_id: qfc.msg.id, reply_markup: {
                                inline_keyboard: []}})

                        //profit
                        const dimiliki = dbSystem.getUserKey(qfc.clicker.id, itemName[1])
                        const total_modal = dbSystem.getUserKey(qfc.clicker.id, "profit."+itemName[1]+"_modal")
                        const hargaRata = Math.round(total_modal / dimiliki)
                        const hasilProfit = (hSatu - hargaRata) * jumlah
                        let upModal = total_modal - (hargaRata*jumlah)
                        if (dimiliki - jumlah === 0)upModal = 0
                        dbSystem.setUserKey(qfc.clicker.id, `profit.${itemName[1]}_modal`, upModal)
                        dbSystem.addUserKey(qfc.clicker.id, `profit.${itemName[1]}`, hasilProfit)

                        //totsl.profit
                        const totalProfit = dbSystem.getUserKey(qfc.clicker.id, "profit.perak") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.emas") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.platinum") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.diamond") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.balaceCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.roadaCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.flagCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.timenCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.loyaliCoin")
                        if (totalProfit > dbSystem.getUserKey(qfc.clicker.id, "high_profit")) dbSystem.setUserKey(qfc.clicker.id, "high_profit", totalProfit)
                        dbSystem.setUserKey(qfc.clicker.id, "total_profit", totalProfit)

                        if (["perak", "emas", "platinum", "diamond"].includes(itemName[1])) sellVolume(itemName[1], jumlah)
                        dbSystem.addUserKey(qfc.clicker.id, itemName[1], -jumlah)
                        dbSystem.addUserKey(qfc.clicker.id, "uang", totalHarga)
                        dbSystem.addUserKey(qfc.clicker.id, "jumlah_trading", 1)


                        Client.editMessageText(`Berhasil melakuka penjualan!\nItem: ${itemName[1]}\nJumlah: ${formatNumber(jumlah)}\nTotal Harga: ${formatNumber(totalHarga)}`, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id,
                            reply_markup: {
                                inline_keyboard: []
                            },
                            entities: [{
                                offset: 0,
                                length: "Berhasil melakuka penjualan!".length,
                                type: "bold"
                            }]
                        })
                    }
                } break

            case "buycoin": {
                Client.editMessageReplyMarkup({
                    inline_keyboard: [
                        [{
                            text: "balaceCoin", callback_data: "buybalaceCoin"
                        }],
                        [{
                            text: "roadaCoin", callback_data: "buyroadaCoin"
                        }],
                        [{
                            text: "flagCoin", callback_data: "buyflagCoin"
                        }],
                        [{
                            text: "timenCoin", callback_data: "buytimenCoin"
                        }],
                        [{
                            text: "loyaliCoin", callback_data: "buyloyaliCoin"
                        }],
                        [{
                            text: "cancel", callback_data: "cancel"
                        }],
                    ]
                }, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id
                })
            } break

            case "buybalaceCoin":
            case "buyroadaCoin":
            case "buyflagCoin":
            case "buytimenCoin":
            case "buyloyaliCoin": {
                    //ry{
                    if (!text) {
                        Client.editMessageReplyMarkup({
                            inline_keyboard: [
                                [{
                                    text: "1", callback_data: `${command} 1`
                                }],
                                [{
                                    text: "10", callback_data: `${command} 10`
                                }],
                                [{
                                    text: "100", callback_data: `${command} 100`
                                }],
                                [{
                                    text: "1000", callback_data: `${command} 1000`
                                }],
                                [{
                                    text: "all", callback_data: `${command} all`
                                }],
                                [{
                                    text: "cancel", callback_data: "cancel"
                                }],
                            ]
                        }, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id
                        })

                        return
                    } else {
                        const itemName = command.split("buy")[1]
                        const hSatu = dbSystem.getGlobalKey(itemName)
                        const jumlah = Number(args[0]) || Math.floor(dbSystem.getUserKey(qfc.clicker.id, "uang") / dbSystem.getGlobalKey(itemName))
                        const totalHarga = hSatu*jumlah

                        if (jumlah <= 0 || dbSystem.getUserKey(qfc.clicker.id, "uang") < totalHarga)return Client.editMessageText("Gagal melakukan pembelian! (jumlah <= 0 atau uang kurang!)", {
                            chat_id: qfc.clicker.id, message_id: qfc.msg.id, reply_markup: {
                                inline_keyboard: []}})
                        dbSystem.addUserKey(qfc.clicker.id, itemName, jumlah)
                        dbSystem.addUserKey(qfc.clicker.id, "uang", -totalHarga)

                        //save total modal
                        dbSystem.addUserKey(qfc.clicker.id, `profit.${itemName}_modal`, totalHarga)

                        Client.editMessageText(`Berhasil melakukan pembelian!\nItem: ${itemName}\nJumlah: ${formatNumber(jumlah)}\nTotal Harga: ${formatNumber(totalHarga)}`, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id,
                            reply_markup: {
                                inline_keyboard: []
                            },
                            entities: [{
                                offset: 0,
                                length: "Berhasil melakuka penjualan!".length,
                                type: "bold"
                            }]
                        })
                    }
                    //} catch(e){
                    //   console.log(e.stack)
                    //}
                } break

            case "sellcoin": {
                Client.editMessageReplyMarkup({
                    inline_keyboard: [
                        [{
                            text: "balaceCoin", callback_data: "sellbalaceCoin"
                        }],
                        [{
                            text: "roadaCoin", callback_data: "sellroadaCoin"
                        }],
                        [{
                            text: "flagCoin", callback_data: "sellflagCoin"
                        }],
                        [{
                            text: "timenCoin", callback_data: "selltimenCoin"
                        }],
                        [{
                            text: "loyaliCoin", callback_data: "sellloyaliCoin"
                        }],
                        [{
                            text: "cancel", callback_data: "cancel"
                        }],
                    ]
                }, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id
                })
            } break

            case "sellbalaceCoin":
            case "sellroadaCoin":
            case "sellflagCoin":
            case "selltimenCoin":
            case "sellloyaliCoin": {
                    if (!text) {
                        Client.editMessageReplyMarkup({
                            inline_keyboard: [
                                [{
                                    text: "1", callback_data: `${command} 1`
                                }],
                                [{
                                    text: "10", callback_data: `${command} 10`
                                }],
                                [{
                                    text: "100", callback_data: `${command} 100`
                                }],
                                [{
                                    text: "1000", callback_data: `${command} 1000`
                                }],
                                [{
                                    text: "all", callback_data: `${command} all`
                                }],
                                [{
                                    text: "cancel", callback_data: "cancel"
                                }],
                            ]
                        }, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id
                        })

                        return
                    } else {
                        const itemName = command.split("sell")[1]
                        const hSatu = dbSystem.getGlobalKey(itemName)
                        const jumlah = Number(args[0]) || dbSystem.getUserKey(qfc.clicker.id, itemName)
                        const totalHarga = hSatu*jumlah

                        if (jumlah <= 0 || dbSystem.getUserKey(qfc.clicker.id, itemName) < jumlah)return Client.editMessageText("Gagal melakukan penjualan! (jumlah <= 0 atau barang dimiliki kurang)", {
                            chat_id: qfc.clicker.id, message_id: qfc.msg.id, reply_markup: {
                                inline_keyboard: []}})

                        //tambah ke profit
                        const dimiliki = dbSystem.getUserKey(qfc.clicker.id, itemName)
                        const total_modal = dbSystem.getUserKey(qfc.clicker.id, "profit."+itemName+"_modal")
                        const hargaRata = Math.round(total_modal / dimiliki)
                        const hasilProfit = (hSatu - hargaRata) * jumlah
                        let upModal = total_modal - (hargaRata*jumlah)
                        if (dimiliki - jumlah === 0) upModal = 0
                        dbSystem.setUserKey(qfc.clicker.id, `profit.${itemName}_modal`, upModal)
                        dbSystem.addUserKey(qfc.clicker.id, `profit.${itemName}`, hasilProfit)

                        //totsl.profit
                        const totalProfit = dbSystem.getUserKey(qfc.clicker.id, "profit.perak") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.emas") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.platinum") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.diamond") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.balaceCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.roadaCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.flagCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.timenCoin") +
                        dbSystem.getUserKey(qfc.clicker.id, "profit.loyaliCoin")
                        if (totalProfit > dbSystem.getUserKey(qfc.clicker.id, "high_profit")) dbSystem.setUserKey(qfc.clicker.id, "high_profit", totalProfit)
                        dbSystem.setUserKey(qfc.clicker.id, "total_profit", totalProfit)


                        dbSystem.addUserKey(qfc.clicker.id, itemName, -jumlah)
                        dbSystem.addUserKey(qfc.clicker.id, "uang", totalHarga)
                        dbSystem.addUserKey(qfc.clicker.id, "jumlah_trading", 1)


                        Client.editMessageText(`Berhasil melakukan penjualan!\nItem: ${itemName}\nJumlah: ${formatNumber(jumlah)}\nTotal Harga: ${formatNumber(totalHarga)}`, {
                            chat_id: qfc.clicker.id,
                            message_id: qfc.msg.id,
                            reply_markup: {
                                inline_keyboard: []
                            },
                            entities: [{
                                offset: 0,
                                length: "Berhasil melakuka penjualan!".length,
                                type: "bold"
                            }]
                        })
                    }
                } break

            case "leaderboard": {
                const allUser = Object.values(dbSystem.getAllUser())

                //sultan
                function takeSultan(data) {
                    const hasil = data.uang +
                    (dbSystem.getGlobalKey("hargaPerak") * data.perak)+
                    (dbSystem.getGlobalKey("hargaEmas") * data.emas)+
                    (dbSystem.getGlobalKey("hargaPlatinum") * data.platinum)+
                    (dbSystem.getGlobalKey("hargaDiamond") * data.diamond)+
                    (dbSystem.getGlobalKey("balaceCoin") * data.balaceCoin)+
                    (dbSystem.getGlobalKey("roadaCoin") * data.roadaCoin)+
                    (dbSystem.getGlobalKey("flagCoin") * data.flagCoin)+
                    (dbSystem.getGlobalKey("timenCoin") * data.timenCoin)+
                    (dbSystem.getGlobalKey("loyaliCoin") * data.loyaliCoin)
                    return hasil
                }

                //kaya
                function takeKaya(data) {
                    return data.uang
                }

                //trader
                function takeTrader(data) {
                    return data.jumlah_trading
                }

                //points
                function takePoints(data) {
                    return data.points
                }

                //profit daily
                function takeProfitDaily(data) {
                    return data.total_profit
                }
                function takeProfitHigh(data) {
                    return data.high_profit
                }

                //pekerjaan
                function takePekerjaan(data) {
                    return data.pekerjaan.pengalaman
                }
                function detailKerja(data) {
                    return `pekerjaan: ${data.pekerjaan.pekerjaan}\n=> Pengalaman: ${formatNumber(data.pekerjaan.pengalaman)} `
                }

                const urutan = allUser.sort((a, b) => {
                    let totalA, totalB

                    switch (args[0]) {
                    case "sultan": {
                            totalA = takeSultan(a); totalB = takeSultan(b)
                        } break
                    case "kaya": {
                            totalA = takeKaya(a); totalB = takeKaya(b)} break
                    case "trader": {
                            totalA = takeTrader(a); totalB = takeTrader(b)} break
                    case "points": {
                            totalA = takePoints(a); totalB = takePoints(b)} break
                    case "profit_daily": {
                            totalA = takeProfitDaily(a); totalB = takeProfitDaily(b)} break
                    case "profit_high": {
                            totalA = takeProfitHigh(a); totalB = takeProfitHigh(b)} break
                    case "pekerjaan": {
                            totalA = takePekerjaan(a); totalB = takePekerjaan(b)} break
                    }
                    return totalB - totalA
                })

                const dapatkan10 = urutan.slice(0, 10)
                const toTex = Object.entries(dapatkan10).map(([k, a], i) => {
                    let totalAset

                    switch (args[0]) {
                    case "sultan": {
                            totalAset = takeSultan(a)} break
                    case "kaya": {
                            totalAset = takeKaya(a)} break
                    case "trader": {
                            totalAset = takeTrader(a)} break
                    case "points": {
                            totalAset = takePoints(a)} break
                    case "profit_daily": {
                            totalAset = takeProfitDaily(a)} break
                    case "profit_high": {
                            totalAset = takeProfitHigh(a)} break
                    case "pekerjaan": {
                            totalAset = detailKerja(a)
                        } break
                    }

                    return `${i+1}. ${a.nama}\n=> ${formatNumber(totalAset) || totalAset}`
                }).join("\n\n")
                let teks = `🏆 ==== ${args[0].split("_").join(" ")} ==== 🏆`
                teks += "\n\n"+toTex
                if (args[0].startsWith("ter")) teks += "\n\nnoted: jumlah diatas merupakan perhitungan leaderboard dari akhir season (merupakan top sultan/trader)"

                Client.editMessageText(teks, {
                    chat_id: qfc.clicker.id,
                    message_id: qfc.msg.id,
                    reply_markup: {
                        inline_keyboard: []
                    }
                })
            } break

            case "lamar_pekerjaan": {
                const pekerjaan_data = await dbSystem.getGlobalKey(`pekerjaan.${args[0]}`)[0]

                dbSystem.setUserKey(qfc.clicker.id, "pekerjaan.pekerjaan", args[0])
                Client.editMessageText("Berhasil melamar pekerjaan "+args[0], {
                    chat_id: qfc.chat.id,
                    message_id: qfc.msg.id,
                    reply_markup: {
                        inline_keyboard: []
                    }
                })
            } break
        }
    } catch(e) {
        console.log(e.stack)
    }
}