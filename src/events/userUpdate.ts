import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { EmbedOptions, UserFlags } from "oceanic.js";

export default new ClientEvent("userUpdate", async function userUpdateEvent(user, oldUser) {
    if (oldUser === null) {
        return;
    }
    const guilds = this.guilds.filter(g => g.members.has(user.id));
    const events: Array<LogEvent> = [];
    for (const guild of guilds) {
        events.push(...(await LogEvent.getType(guild.id, LogEvents.USER_UPDATE)));
    }
    if (events.length === 0) {
        return;
    }

    const embeds: Array<EmbedOptions> = [];

    if (user.avatar !== oldUser.avatar) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("User Updated")
            .setColor(Colors.gold)
            .setDescription([
                `User: **${user.tag}** (${user.id})`,
                "This user's avatar was updated."
            ])
            .setImage(user.avatarURL())
            .toJSON()
        );
    }

    if (user.discriminator !== oldUser.discriminator) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("User Updated")
            .setColor(Colors.gold)
            .setDescription([
                `User: **${user.tag}** (${user.id})`,
                "This user's discriminator was updated."
            ])
            .addField("Old Discriminator", oldUser.discriminator, true)
            .addField("New Discriminator", user.discriminator, true)
            .toJSON()
        );
    }

    const oldFlags = Util.getFlagsArray(UserFlags, oldUser.publicFlags);
    const newFlags = Util.getFlagsArray(UserFlags, user.publicFlags);
    const addedFlags = newFlags.filter(f => !oldFlags.includes(f));
    const removedFlags = oldFlags.filter(f => !newFlags.includes(f));
    if (addedFlags.length !== 0 || removedFlags.length !== 0) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("User Updated")
            .setColor(Colors.gold)
            .setDescription([
                `User: **${user.tag}** (${user.id})`,
                "This user's flags were updated.",
                "",
                "```diff",
                ...addedFlags.map(f => `+ ${f}`),
                ...removedFlags.map(f => `- ${f}`),
                "```"
            ])
            .toJSON()
        );
    }

    if (user.username !== oldUser.username) {
        embeds.push(Util.makeEmbed(true)
            .setTitle("User Updated")
            .setColor(Colors.gold)
            .setDescription([
                `User: **${user.tag}** (${user.id})`,
                "This user's username was updated."
            ])
            .addField("Old Username", oldUser.username, true)
            .addField("New Username", user.username, true)
            .toJSON()
        );
    }

    if (embeds.length === 0) {
        return;
    }

    for (const log of events) {
        await log.execute(this, { embeds });
    }
});
