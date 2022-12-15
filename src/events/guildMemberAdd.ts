import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { UserFlagNames } from "../util/Names.js";
import Config from "../config/index.js";
import { UserFlags } from "oceanic.js";

export default new ClientEvent("guildMemberAdd", async function guildMemberAddEvent(member) {
    const events = await LogEvent.getType(member.guildID, LogEvents.MEMBER_ADD);
    if (events.length === 0) {
        return;
    }

    const flags = Util.getFlagsArray(UserFlags, member.user.publicFlags);
    const embed = Util.makeEmbed(true)
        .setTitle("Member Joined")
        .setColor(Colors.green)
        .addField("Member Info", [
            `User: **${member.tag}** (${member.mention})`,
            ...(member.nick ? [`Nickname: **${member.nick}**`] : []),
            `Roles: ${member.roles.map(r => `<@&${r}>`).join(" ")}`,
            `Created At: ${Util.formatDiscordTime(member.createdAt, "short-datetime", true)}`,
            `Pending: **${member.pending ? "Yes" : "No"}**`,
            ...(flags.length === 0 ? [] : [
                "",
                "**Badges**:",
                ...flags.map(f => `${Config.emojis.default.dot} ${UserFlagNames[UserFlags[f]]}`),
                ...(member.id === "242843345402069002" ? [`${Config.emojis.default.dot} ${Config.emojis.custom.don} MaidBoye Developer`] : [])
            ])
        ].join("\n"), false);

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
