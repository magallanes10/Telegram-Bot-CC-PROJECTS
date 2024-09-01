const fs = require('fs');
const path = require('path');

const authorizedUserIds = ['5101069743'];

module.exports = (bot) => ({
  name: "cmd",
  desc: "Reload a specific command module",
  credit: "Jonell Magallanes",
  onPrefix: true,
  cooldowns: 5,

  execute: async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const args = text.split(" ").slice(2);
    const commandName = args[0];

    if (!authorizedUserIds.includes(userId.toString())) {
      return bot.sendMessage(chatId, "You are not authorized to use this command.");
    }

    if (!commandName) {
      return bot.sendMessage(chatId, "Please provide the name of the command to reload.\n\nExample: /cmd load image");
    }

    const commandsPath = path.join(__dirname);

    try {
      const commandPath = path.join(commandsPath, `${commandName}.js`);
      if (!fs.existsSync(commandPath)) {
        return bot.sendMessage(chatId, `The command "${commandName}" does not exist.`);
      }

      delete require.cache[require.resolve(commandPath)];

      const commandModule = require(commandPath)(bot);

      bot.sendMessage(chatId, `The command "${commandName}" has been reloaded successfully.`);

    } catch (error) {
      console.error('Error reloading command:', error);
      return bot.sendMessage(chatId, `An error occurred while reloading the command "${commandName}".`);
    }
  }
});
