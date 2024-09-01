const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

module.exports = (bot) => ({
  name: "music",
  desc: "Search and download music from YouTube",
  credit: "Jonell Magallanes",
  onPrefix: true,
  cooldowns: 10,

  execute: async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      const args = text.split(" ").slice(1);
      if (!args[0]) {
        return bot.sendMessage(chatId, "❌ Please enter a music name!");
      }

      const song = args.join(" ");
      const findingMessage = await bot.sendMessage(chatId, `🔍 | Finding "${song}". Please wait...`);

      const searchResults = await yts(song);
      const firstResult = searchResults.videos[0];

      if (!firstResult) {
        await bot.sendMessage(chatId, `❌ | No results found for "${song}".`);
        return;
      }

      const { title, author, duration, url } = firstResult;

      await bot.editMessageText(`⏱️ | Music info found: "${title}" by ${author.name}. Downloading...`, {
        chat_id: chatId,
        message_id: findingMessage.message_id
      });

      const filePath = path.resolve(__dirname, 'temp', `${Date.now()}-${title}.mp3`);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const stream = ytdl(url, { filter: 'audioonly' });
      const fileStream = fs.createWriteStream(filePath);

      stream.pipe(fileStream);

      fileStream.on('finish', async () => {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 25) {
          await bot.sendMessage(chatId, `❌ | The file size exceeds 25MB limit. Unable to send "${title}".`);
          fs.unlinkSync(filePath);
          return;
        }

        await bot.sendAudio(chatId, fs.createReadStream(filePath), {
          caption: `🎵 | Here is your music: "${title}"\n\nTitle: ${title}\nAuthor: ${author.name}\nDuration: ${duration.timestamp}\nYouTube Link: ${url}`
        });

        fs.unlinkSync(filePath);
        bot.deleteMessage(chatId, findingMessage.message_id);
      });

      stream.on('error', async (error) => {
        console.error(error);
        await bot.sendMessage(chatId, `❌ | Sorry, there was an error downloading the music`);
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, `❌ | Sorry, there was an error getting the music`);
    }
  }
});
