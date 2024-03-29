const Discord = require('discord.js'); // eslint-disable-line no-unused-vars
const getLevelReplyOf = require('../shared/level');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Shows Avatar Request Level of a user.')
        .addUserOption((option) => option.setName('user').setDescription('The user to check the level of.').setRequired(true)),
    usage: '`/level <user>` - Shows Avatar Request Level of a user.',
    allowInOtherGuilds: true,
    /**
     * 
     * @param {Discord.CommandInteraction} interaction 
     */
    async execute(interaction) {
        // Shared command for prefix as well as slash command
        const reply = getLevelReplyOf(interaction.options.getUser('user'));

        await interaction.reply(reply).catch(console.error);
    },
};
