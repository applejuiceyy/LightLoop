const DataStorage = require('./DataStorage');
const roles = process.env.REQUEST_TIER_ROLES.split(',');

function levelup(member) {
    if (DataStorage.storage.people[member.id] == undefined) {
        DataStorage.storage.people[member.id] = {level:1}
    }
    else {
        DataStorage.storage.people[member.user.id].level++;
    }
    DataStorage.save();
    updateroles(member, DataStorage.storage.people[member.user.id].level);
}

function levelset(member, level) {
    if (DataStorage.storage.people[member.user.id] == undefined) {
        DataStorage.storage.people[member.user.id] = {level:level}
    }
    else {
        DataStorage.storage.people[member.user.id].level = level;
    }
    DataStorage.save();
    updateroles(member, level);
}

async function updateroles(member, level) {
    let tier = parseInt(level/10);
    let tierindex = tier-1;
    if (tierindex > roles.length-1) {
        tierindex = roles.length-1;
    }
    await member.roles.remove(roles.filter(role => role != roles[tierindex])).catch(console.error);
    if (tierindex < 0) return;
    await member.roles.add(roles[tierindex]).catch(console.error);
}

module.exports = {levelset,levelup}