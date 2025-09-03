import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config(); // 🔑 تحميل القيم من .env

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const TOKEN = process.env.TOKEN; // ✅ جلب التوكن من .env

async function getTikTokInfo(username) {
  try {
    username = username.replace("@", "");
    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    };

    const res = await axios.get(`https://www.tiktok.com/@${username}`, { headers });
    const $ = cheerio.load(res.data);
    const script = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();

    if (!script) return null;

    const jsonData = JSON.parse(script)["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"];
    const user = jsonData.user;
    const stats = jsonData.stats;

    return {
      id: user.id,
      nickname: user.nickname,
      verified: user.verified ? "Yes" : "No",
      private: user.privateAccount ? "Yes" : "No",
      secUid: user.secUid,
      followers: stats.followerCount,
      following: stats.followingCount,
      likes: stats.heart,
      videoCount: stats.videoCount,
      openFavorite: user.openFavorite ? "Yes" : "No",
      followingVisible: user.followingVisibility == 1 ? "Yes" : "No",
      language: user.language,
      region: user.region,
      createTime: new Date(parseInt(user.id) >> 31).toString(),
      lastNameChange: user.nickNameModifyTime
        ? new Date(user.nickNameModifyTime * 1000).toString()
        : "Unknown",
    };
  } catch {
    return null;
  }
}

// 📌 أمر ديسكورد
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!tiktok") || message.author.bot) return;

  const args = message.content.split(" ");
  const username = args[1];

  if (!username) return message.reply("❌ اكتب يوزر التيك توك: `!tiktok username`");

  const info = await getTikTokInfo(username);
  if (!info) return message.reply("❌ ما حصلت معلومات عن هذا الحساب.");

  message.reply(`
📌 معلومات الحساب @${username} :

🆔 UserID: ${info.id}
👤 Nickname: ${info.nickname}
✅ Verified: ${info.verified}
🔒 Private: ${info.private}
🌍 Region: ${info.region}
🌐 Language: ${info.language}

📊 Followers: ${info.followers}
📊 Following: ${info.following}
❤️ Likes: ${info.likes}
🎥 Videos: ${info.videoCount}

📁 Open Favorite: ${info.openFavorite}
👀 Can See Following: ${info.followingVisible}
🗓 Create Time: ${info.createTime}
📝 Last Nickname Change: ${info.lastNameChange}
  `);
});

client.login(TOKEN);