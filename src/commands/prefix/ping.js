const Discord = require('discord.js'); // eslint-disable-line no-unused-vars

module.exports = {
    name: 'ping',
    description: 'Ping command for testing.',
    allowInOtherGuilds: true,

    experimental: true,
    arguments: [],
    /**
     * 
     * @param {import('../../message/context').Context} context 
     */
    async execute(context) {
        await context.reply('Pong!');
    },
};
