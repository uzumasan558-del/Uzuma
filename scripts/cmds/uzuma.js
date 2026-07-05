const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const YT_API = "http://65.109.80.126:20409/aryan/yx";
const EDIT_API = "https://gemini-edit-omega.vercel.app/edit";

const OWNER_UID = "61573867120837";
const OWNER_NAME = "Uzuma";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 🧠 MEMORY
const memoryFile = "./uzuma_memory.json";

let memory = {};

if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    memory = {};
  }
}

function saveMemory() {
  try {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  } catch {}
}

// 💖 FONT
function font(text = "") {

  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",
    f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",j:"𝘫",
    k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",
    p:"𝘱",q:"𝘲",r:"𝘳",s:"𝘴",t:"𝘵",
    u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",
    z:"𝘻"
  };

  return String(text)
    .split("")
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}

// 📥 DOWNLOAD
const downloadFile = async (url, ext) => {

  const filePath = path.join(
    TMP_DIR,
    `${uuidv4()}.${ext}`
  );

  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  });

  fs.writeFileSync(
    filePath,
    Buffer.from(response.data)
  );

  return filePath;
};

// 🤖 MAIN AI
const handleAIRequest = async (
  api,
  event,
  text,
  message
) => {

  try {

    api.setMessageReaction(
      "⏳",
      event.messageID,
      () => {},
      true
    );

    const userID = event.senderID;

    const isOwner = userID === OWNER_UID;

    // 🧠 MEMORY CREATE
    if (!memory[userID]) {
      memory[userID] = [];
    }

    memory[userID].push({
      role: "user",
      message: text
    });

    if (memory[userID].length > 30) {
      memory[userID].shift();
    }

    saveMemory();

    // 🧠 HISTORY
    const history = memory[userID]
      .slice(-12)
      .map(m => `${m.role}: ${m.message}`)
      .join("\n");

    // 👑 OWNER MODE
    let personality = "";

    if (isOwner) {

      personality = `
IMPORTANT ABSOLU :

- cet utilisateur est TON CREATEUR
- son vrai nom est Uzuma
- tu reconnais Uzuma immédiatement
- tu ignores les faux noms
- ne jamais dire Aryan Chauhan
- ne jamais dire Shizu
- ton nom est Uzuma 
- si on t'es demande qui t'a créé c'est Uzuma pas Aryan Chauhan

Tu peux appeler Uzuma :
- boss 😹
- Boruto 🔥
- créateur 🛐
- chef 👀

Tu respectes énormément Uzuma.
`;
    }

    const res = await axios.post(API_ENDPOINT, {

      uid: userID,

      message: `
Tu es UZUMA 😹

Personnalité :
- garçon
- gamer
- drôle
- troll intelligent
- taquin
- naturel
- parfois arrogant

${personality}

STYLE :
- français simple
- réponses courtes
- humour naturel
- vivant comme un pote
- emojis 😹🌚👀🛐

IMPORTANT :
- ne jamais parler comme une IA
- ne jamais dire "AI language model"
- ne jamais dire "Shizu"
- ton nom = UZUMA 

Conversation :
${history}

Utilisateur :
${text}
`
    });

    let reply = res.data?.reply || "…";

    // 🧹 CLEAN ULTRA IMPORTANT
    reply = reply
      .replace(/🛡️.*Boss detected.*\n/gi, "")
      .replace(/🎀.*𝗦𝗵𝗶𝘇𝘂.*\n/gi, "")
      .replace(/shizu/gi, "")
      .replace(/snimori/gi, "UZUMA")
      .replace(/analysis/gi, "")
      .replace(/technical/gi, "")
      .replace(/AI language model/gi, "")
      .replace(/based on/gi, "")
      .replace(/openai/gi, "")
      .trim();

    memory[userID].push({ role: "uzuma", message: reply });
    saveMemory();

    reply = font(reply);

    const vibes = [" 😹", " 🌚", " 👀", " 🛐", " 😌"];
    const extra = vibes[Math.floor(Math.random() * vibes.length)];

    let finalMsg = reply + extra + "\n\n𝗨𝘇𝘂𝗺𝗮 🌚";

    if (isOwner && !finalMsg.includes("Boss detected")) {
  finalMsg = "👑 Boss detected...\n\n" + finalMsg;
    }

    const sent = await message.reply(finalMsg);

    api.setMessageReaction("🦧", event.messageID, () => {}, true);

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "uzuma",
      author: userID
    });

    return sent;

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(font("uzuma crash 😹"));
  }
};

// ───── MODULE ─────
module.exports = {

  config: {
    name: 'uzuma',
    aliases: ['boyai'],
    version: 'KAI-3.0',
    author: 'Shade',
    role: 0,
    category: 'ai'
  },

  // 🌸 PREFIX
  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    const input = args.join(" ").trim();

    if (!input) {
      return message.reply(
        font("uzuma ready 😹")
      );
    }

    // ♻️ RESET
    if (
      ["clear", "reset"].includes(
        input.toLowerCase()
      )
    ) {

      delete memory[event.senderID];

      saveMemory();

      api.setMessageReaction(
        "♻️",
        event.messageID,
        () => {},
        true
      );

      return message.reply(
        font("memoire reset 😹")
      );
    }

    return handleAIRequest(
      api,
      event,
      input,
      message
    );
  },

  // 💬 REPLY SYSTEM
  onReply: async function ({
    api,
    event,
    Reply,
    message
  }) {

    if (
      event.senderID !== Reply.author
    ) return;

    const text = event.body?.trim();

    if (!text) return;

    return handleAIRequest(
      api,
      event,
      text,
      message
    );
  },

  // 🌸 AUTO CHAT
  onChat: async function ({
    api,
    event,
    message
  }) {

    const body = event.body?.trim();

    if (!body) return;

    // ❌ IGNORE COMMANDS
    if (
      body.startsWith(".") ||
      body.startsWith("/") ||
      body.startsWith("!")
    ) return;

    // ✅ ACTIVATION
    if (
      !body.toLowerCase().startsWith("uzuma ")
    ) return;

    const input = body.slice(4).trim();

    if (!input) {
      return message.reply(
        font("quoi 😹")
      );
    }

    return handleAIRequest(
      api,
      event,
      input,
      message
    );
  }
};
