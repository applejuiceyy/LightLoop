const Discord = require('discord.js'); // eslint-disable-line no-unused-vars
const CronJob = require('cron').CronJob;
const utility = require('../util/utility');

/**
 * Check backend status every 10 minutes
 * and update the status channel
 * @param {Discord.Client} client 
 */
module.exports.start = async function (client) {
    const job = new CronJob('0 */10 * * * *', function () {
        utility.checkBackendStatus(client);
    }, null, true, 'Europe/London');
    job.start();
};
