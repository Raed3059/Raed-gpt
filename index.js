import { Client, GatewayIntentBits, Partials } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!TOKEN || !GEMINI_KEY) throw new Error("ضع DISCORD_TOKEN و GEMINI_API_KEY في .env");

const BOT_NAME = "R∆3D";
const MY_NAME = "رائد";
const CHANNEL_ID = "1411433034711826513";
const OWNER_ID = "1079022798523093032";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// دالة إرسال الأخطاء للمالك
async function notifyOwner(error) {
  try {
    const owner = await client.users.fetch(OWNER_ID);
    owner.send(`⚠️ خطأ في البوت:\n\`\`\`${error.stack || error}\`\`\``);
  } catch (e) {
    console.error("لم أستطع إرسال الخطأ للمالك:", e);
  }
}

// دوال Gemini API
async function geminiChat(prompt) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  return data?.content?.[0]?.parts?.[0]?.text || "لم أستطع الرد";
}

async function geminiImage(prompt) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateImage",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({ prompt, imageDimensions: { width: 512, height: 512 } })
    }
  );
  const data = await res.json();
  return data?.imageUrl;
}

async function geminiAnalyze(url) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:analyzeImage",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({ imageUrl: url })
    }
  );
  const data = await res.json();
  return data?.description || "لا يوجد تحليل";
}

// معالجة الرسائل
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== CHANNEL_ID) return;

    const content = message.content.trim();
    const mentioned = message.mentions.has(client.user) ||
                      content.toLowerCase().includes(BOT_NAME.toLowerCase()) ||
                      content.includes(MY_NAME);
    if (!mentioned) return;

    // تحقق من رابط صورة
    const urlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
    const imageUrl = content.match(urlRegex)?.[0];
    if (imageUrl) {
      const analysis = await geminiAnalyze(imageUrl);
      return message.reply(`تحليل الصورة:\n${analysis}`);
    }

    // تحقق من طلب إنشاء صورة
    const createImgKeywords = ["ارسم","صورة","generate image","create image","رسم"];
    const isImageRequest = createImgKeywords.some(word => content.includes(word));
    if (isImageRequest) {
      const imgUrl = await geminiImage(content);
      return message.reply({ files: [imgUrl] });
    }

    // باقي الرسائل => نص AI
    const res = await geminiChat(content);
    message.reply(res);

  } catch (e) {
    console.error(e);
    notifyOwner(e);
    message.reply("❌ صار خطأ أثناء معالجة الرسالة.");
  }
});

client.login(TOKEN);