require("./config.js")
const botApi = require("node-telegram-bot-api")
const token = global.token_bot
const Client = new botApi(token, {
    polling: true
})

const c = require("chalk")
const path = require("path")
const process = require("process")
const moment = require("moment-timezone")
const parser = require("uzi_telegram-parser")
const fs = require("fs")

const dbSystem = require("./lib/func_db.js")
const {
    randomBotTrading,
    updateBotName,
    addBotEffect,
    clearBotEffect,
    party_fc
} = require("./lib/func_bot.js") 

const {
    randItem,
    randCoin,
    reset_volume
} = require("./lib/func_cointem")

if (!dbSystem)console.log("Error not find dbSystem file".red);
async function checkingGlobalDB() {
    console.log(c.blueBright("\n📂 Checking global database..."))
    await dbSystem.createDBGlobal()
}
checkingGlobalDB()

Client.on("message", async (m) => {
    require("./System/message.js")(Client, m)
})

Client.on("callback_query", (q) => {
    try {
        require("./System/query.js")(Client, q)
    } catch (e) {
        console.log(e.stack.red)
    }
})

function backup() {
    console.log(c.blueBright("\n🔁 Process backup database..."))
    Client.sendDocument("8141687459", path.join(process.cwd(), "database", "user.json"))
    Client.sendDocument("8141687459", path.join(process.cwd(), "database", "global.json"))
}

function resetProfitDaily() {
    const allUser = Object.entries(dbSystem.getAllUser())
    const listReset = ["perak",
        "emas",
        "platinum",
        "diamond",
        "balaceCoin",
        "roadaCoin",
        "flagCoin",
        "timenCoin",
        "loyaliCoin"]

    for (let [key, value] of allUser) {
        for (let i = 0; i < listReset.length; i++) {
            dbSystem.setUserKey(key, `profit.${listReset[i]}`, 0)
        }
        dbSystem.setUserKey(key, "total_profit", 0)
    }
}

function pajakHarian() {
    const all_user_data = dbSystem.getAllUser()
    const all_user_key = Object.keys(all_user_data)

    for (let key of all_user_key) {
        const user = all_user_data[key]

        if (user.total_profit < 0)continue
        const pajak = Math.floor(user.total_profit * 0.05)
        dbSystem.addUserKey(key, "uang", -pajak)
    }
}

setInterval(async() => {
    const now = moment().tz("Asia/Jakarta")
    const jam = now.format("HH")
    const menit = now.format("mm")
    const detik = now.format("ss")
    
    if (detik === "20")randomBotTrading()
    if (detik === "00") {
        randItem(); randCoin(); 
    }
    if(detik === "02") reset_volume();

    // waktu bot smarr
    if (jam == "20" && menit == "01" && detik == "01") { clearBotEffect("smart"); addBotEffect("smart", 5+dbSystem.getGlobalKey("season")) }
    if (jam == "23" && menit == "01" && detik == "01") { clearBotEffect("smart"); addBotEffect("smart", 5+dbSystem.getGlobalKey("season")) }
    if (jam == "02" && menit == "01" && detik == "01") { clearBotEffect("smart"); addBotEffect("smart", 5+dbSystem.getGlobalKey("season")) }
    if (jam == "04" && menit == "01" && detik == "01") clearBotEffect("smart")

    // waktubbuatbbot fast
    if (jam == "15" && menit == "01" && detik == "01") {
        clearBotEffect("fast"); addBotEffect("fast", 8)
    }
    if (jam == "18" && menit == "01" && detik == "01") clearBotEffect("fast")

    if ([menit, detik].every((k) => k === "00")) backup()
    if (jam === "23" && menit === "50" && detik === "00") {
        pajakHarian()
        resetProfitDaily()
    }
    
    //party
    if(Number(menit) % 5 === 0 && Number(detik) === 0) party_fc.check_party()
    if(menit === "00" && detik === "00")party_fc.check_party(true)
}, 1000);