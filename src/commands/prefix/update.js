const Discord = require('discord.js'); // eslint-disable-line no-unused-vars
const path = require('path');
const shelljs = require('shelljs');
const fs = require('fs');

const file = path.join(__dirname, '../../../update.sh');
const flag = path.join(__dirname, '../../../storage/restart.json');

module.exports = {
    name: 'update',
    usage: '`?update` - Update the bot by pulling from the repository.',
    moderator: true,
    /**
     * 
     * @param {Discord.Message} message 
     */
    async execute(message) { // eslint-disable-line no-unused-vars
        await message.reply('Restarting...');
        fs.writeFileSync(flag, message.channel.id);
        shelljs.exec(file);
    },
};
