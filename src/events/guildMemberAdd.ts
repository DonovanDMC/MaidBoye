import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { GuildMemberFlagNames, UserFlagNames } from "../util/Names.js";
import Config from "../config/index.js";
import WelcomeMessageHandler from "../util/handlers/WelcomeMessageHandler.js";
import { GuildMemberFlags, UserFlags } from "oceanic.js";

export default new ClientEvent("guildMemberAdd", async function guildMemberAddEvent(member) {
    await WelcomeMessageHandler.handle(member);

    const events = await LogEvent.getType(member.guildID, LogEvents.MEMBER_ADD);
    if (events.length === 0) {
        return;
    }

    const flags = Util.getFlagsArray(UserFlags, member.user.publicFlags);
    const guildFlags = Util.getFlagsArray(GuildMemberFlags, member.flags);
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
            ]),
            ...(guildFlags.length === 0 ? [] : [
                "",
                "**Flags**:",
                ...guildFlags.map(f => `${Config.emojis.default.dot} ${GuildMemberFlagNames[GuildMemberFlags[f]]}`)
            ])
        ].join("\n"), false);

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
