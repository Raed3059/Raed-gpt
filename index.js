import fs from 'fs';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) throw new Error("Set DISCORD_TOKEN in .env");

const BOT_NAME = 'R∆3D';
const MY_NAME = 'رائد';
const CHANNEL_ID = '1411433034711826513';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// محاكاة Puter.js في Node
let puter;
async function loadPuter() {
  const puterJs = await fetch('https://js.puter.com/v2/').then(res => res.text());
  eval(puterJs); // ⚠️ فقط للتجربة، على سيرفر حقيقي استخدم browser context
}

await loadPuter();

client.on('ready', () => {
  console.log(`${BOT_NAME} جاهز! Logged in as ${client.user.tag}`);
  client.user.setUsername(BOT_NAME).catch(() => {});
});

client.on('messageCreate', async message => {
  try {
    if (message.author.bot) return; // تجاهل البوتات
    if (message.channel.id !== CHANNEL_ID) return; // فقط القناة المخصصة

    const content = message.content.trim();

    // يرد لو ذكر البوت أو اسم رائد أو اسمه
    const mentioned = message.mentions.has(client.user) ||
                      content.toLowerCase().includes(BOT_NAME.toLowerCase()) ||
                      content.includes(MY_NAME);

    if (!mentioned) return;

    // 🔹 محاولة التعرف إذا هي صورة أو طلب إنشاء صورة
    const urlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/i;
    const imageUrl = content.match(urlRegex)?.[0];

    // لو فيها رابط صورة => تحليل
    if (imageUrl) {
      const analysis = await puter.ai.analyze(imageUrl);
      return message.reply(`تحليل الصورة:\n${analysis}`);
    }

    // لو تحتوي كلمات دالة على إنشاء صورة
    const createImgKeywords = ['ارسم', 'صورة', 'generate image', 'create image', 'رسم'];
    const isImageRequest = createImgKeywords.some(word => content.includes(word));

    if (isImageRequest) {
      const imgRes = await puter.ai.image(content, { width: 512, height: 512 });
      return message.reply({ files: [imgRes.url] });
    }

    // باقي الرسائل => نص AI
    const res = await puter.ai.chat(content, { model: "gpt-4o" });
    message.reply(res);

  } catch (e) {
    console.error(e);
    message.reply("صار خطأ أثناء معالجة الرسالة.");
  }
});

client.login(TOKEN);