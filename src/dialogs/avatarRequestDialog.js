const Discord = require('discord.js'); // eslint-disable-line no-unused-vars
const utility = require('../util/utility');
const tags = require('../components/avatarRequestTags');
const types = require('../components/avatarRequestTypes');
const newRequestButton = require('../components/newRequestButton');
const DataStorage = require('../util/dataStorage');
const requestReactions = require('../util/requestReactions');

const questions = [
    utility.buildEmbed('Title (1/5)', 'The title of your request. Should only be 1-5 words. Just start typing below and send the message:'),
    utility.buildEmbed('Description (2/5)', 'Explain what exactly you need, what requirements it should have, any important details, style, whatever you can think of that might be useful for others to know.'),
    utility.buildEmbed('Type (3/5)', 'Select the type of request.', [types]),
    utility.buildEmbed('Tags (4/5)', 'Select the tags that fit your request.', [tags]),
    utility.buildEmbed('Reference Image (5/5)', 'We highly recommend adding an image to your request, so that people can more easily make your request. If you dont want an image, just type "skip".'),
    utility.buildEmbed('Preview', 'Here is a preview of your request. If you are happy with it, type "confirm". If you want to try again, type "cancel".'),
];

// Dialog for both creating or editing avatar requests
// Which of the two gets decided by options

/**
 * @param {Discord.Message} message 
 * @param {Discord.TextChannel | Discord.User} channel 
 * @param {*} dialog 
 * @param {*} options 
 */
module.exports.handle = async function (message, channel, dialog, options) {

    if (dialog.step != -1 && (message.content.toLowerCase() == 'cancel' || message.content.toLowerCase() == 'abort')) {
        channel.send(utility.buildEmbed('Action canceled.')).catch(console.error);
        return true;
    }

    // In edit mode, allow skipping
    let defaultValues;
    let skip;
    if (options.mode == 'edit') {
        defaultValues = deconstructAvatarRequestEmbed(options.msg.embeds[0]);
        skip = message?.content.toLowerCase() == 'skip';
    }

    if (dialog.step == -1) {
        next(dialog, channel);

        return false;
    }
    else if (dialog.step == 0) {
        if (message.content == '') {
            channel.send(utility.buildEmbed('Please enter a title.'));
            return false;
        }
        if (skip) dialog.data.push(defaultValues[0]);
        else dialog.data.push(message.content.substring(0, 256));

        next(dialog, channel);

        return false;
    }
    else if (dialog.step == 1) {
        if (message.content == '') {
            channel.send(utility.buildEmbed('Please enter a description.'));
            return false;
        }
        if (skip) dialog.data.push(defaultValues[1]);
        else dialog.data.push(message.content);

        next(dialog, channel);

        return false;
    }
    else if (dialog.step == 2) {
        if (skip) {
            dialog.data.push(defaultValues[2]);
            next(dialog, channel);
        }
        else {
            channel.send(utility.buildEmbed('Please select type.')).catch(console.error);
        }

        return false;
    }
    else if (dialog.step == 3) {
        if (skip) {
            dialog.data.push(defaultValues[3]);
            next(dialog, channel);
        }
        else {
            channel.send(utility.buildEmbed('Please select tags.')).catch(console.error);
        }

        return false;
    }
    else if (dialog.step == 4) {
        const image = message.attachments.values().next().value;
        if (skip) dialog.data.push(defaultValues[1]);
        else dialog.data.push(image ?? message.content);

        await next(dialog, channel);

        channel.send(constructAvatarRequestEmbed(dialog, message.author)).catch(console.error);

        return false;
    }
    else if (dialog.step == 5) {
        if (message.content.toLowerCase() != 'confirm') {
            channel.send(utility.buildEmbed('Please send either "confirm" or "cancel".')).catch(console.error);
            return false;
        }

        channel.send(utility.buildEmbed('Done!', 'The request is now completed!\n\nYou can react to your request\'s message for some actions.\n✅ Archive request when completed\n❌ Delete request\n📝 Edit request\n\nOthers can react with ⚙️ to show that they are working on your request.')).catch(console.error);

        try {
            const requestsChannel = await message.client.channels.fetch(process.env.REQUESTS_CHANNEL);

            if (options.mode == 'create') {
                const msg = await requestsChannel.send(constructAvatarRequestEmbed(dialog, message.author));
                msg.react('✅').then(() => msg.react('❌').then(() => msg.react('📝').then(() => msg.react('⚙️'))));

                let threadName = dialog.data[0].substr(0, 99).replace(/[^A-Za-z0-9_+-.,&()]/gi, '');
                if (threadName == '') threadName = 'Request';

                const thread = await msg.startThread({ name: threadName, autoArchiveDuration: 'MAX' });
                thread.members.add(message.author).catch(console.error);
                thread.send(utility.buildEmbed('Remember to archive the request when it\'s completed ✅.\nOthers can react with ⚙️ to show that they are working on your request.'));

                await bringNewRequestButtonToTheBottom(message.client);

                const element = { message: msg.id, user: message.author.id, timestamp: Date.now(), locked: false, thread: thread.id };
                if (!DataStorage.storage.avatar_requests) DataStorage.storage.avatar_requests = [];
                DataStorage.storage.avatar_requests.push(element);
                DataStorage.save('storage');

                requestReactions.createCollector(msg, element);
            }
            else if (options.mode == 'edit') {
                const m = constructAvatarRequestEmbed(dialog, message.author);
                m.embeds[0].color = options.msg.embeds[0].color;
                options.msg.edit(m);
            }
        }
        catch (error) {
            console.error(error);
        }

        return true;
    }
};

/**
 * 
 * @param {Discord.Interaction} interaction 
 * @param {*} dialog 
 */
module.exports.handleInteraction = function (interaction, dialog) {

    if (dialog.step == 2 && interaction.customId == 'types' && interaction.isSelectMenu()) {
        interaction.update(utility.buildEmbed('Type saved.')).catch(console.error);
        dialog.data.push(interaction.values);

        next(dialog, interaction.user);

        return false;
    }
    else if (dialog.step == 3 && interaction.customId == 'tags' && interaction.isSelectMenu()) {
        interaction.update(utility.buildEmbed('Tags saved.')).catch(console.error);
        dialog.data.push(interaction.values);

        next(dialog, interaction.user);

        return false;
    }
};

/**
 * Utility function that increments dialog step and sends the next element in the questions array
 * @param {*} dialog 
 * @param {Discord.User} user 
 */
async function next(dialog, user) {
    dialog.step++;
    await user.send(questions[dialog.step]).catch(console.error);
}


/**
 * Gets the new request button from datastorage and puts its at the bottom of the requests channel
 * @param {Discord.Client} client 
 */
async function bringNewRequestButtonToTheBottom(client) {
    try {
        const oldBtnId = DataStorage.storage.new_request_button;
        const channel = await client.channels.fetch(process.env.REQUESTS_CHANNEL);
        const newBtn = await channel.send(newRequestButton);
        DataStorage.storage.new_request_button = newBtn.id;
        if (oldBtnId) {
            const oldBtn = await channel.messages.fetch(oldBtnId);
            oldBtn.delete().catch(console.error);
        }
    }
    catch (error) {
        console.error(error);
    }
}

/**
 * Build the embed for the avatar request
 * @param {*} dialog 
 * @param {Discord.User} user 
 * @returns 
 */
function constructAvatarRequestEmbed(dialog, user) {
    const ret =
    {
        embeds: [
            {
                title: dialog.data[0],
                description: dialog.data[1],
                author: {
                    name: user.username,
                    iconURL: user.avatarURL(),
                },
                image: dialog.data[4],
                fields: [
                    {
                        name: 'Tags',
                        value: dialog.data[3].join('\n'),
                        inline: true,
                    },
                    {
                        name: 'Type',
                        value: dialog.data[2].join('\n'),
                        inline: true,
                    },
                ],
                color: '2aacf7', // blue
            },
        ],
    };
    return ret;
}

/**
 * Get all the avatar request values back from an embed
 * @param {Discord.MessageEmbed} embed 
 * @returns 
 */
function deconstructAvatarRequestEmbed(embed) {
    const ret = [];
    ret.push(embed.title);
    ret.push(embed.description);
    ret.push(embed.fields[1].value.split('\n'));
    ret.push(embed.fields[0].value.split('\n'));
    ret.push(embed.image);
    return ret;
}
