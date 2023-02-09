import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import WelcomeMessageHandler from "../util/handlers/WelcomeMessageHandler.js";

export default new ClientEvent("guildMemberAdd", async function guildMemberAddEvent(member) {
    await WelcomeMessageHandler.handle(member, "join");

    const events = await LogEvent.getType(member.guildID, LogEvents.MEMBER_ADD);
    if (events.length === 0) {
        return;
    }

    const badges = Util.formatBadges(member);
    const flags = Util.formatFlags(member);
    const embed = Util.makeEmbed(true)
        .setTitle("Member Joined")
        .setColor(Colors.green)
        .addField("Member Info", [
            `User: **${member.tag}** (${member.mention})`,
            ...(member.nick ? [`Nickname: **${member.nick}**`] : []),
            `Roles: ${member.roles.map(r => `<@&${r}>`).join(" ")}`,
            `Created At: ${Util.formatDiscordTime(member.createdAt, "short-datetime", true)}`,
            `Pending: **${member.pending ? "Yes" : "No"}**`,
            ...(badges === "" ? [] : [
                "",
                "**Badges**:",
                badges
            ]),
            ...(flags === "" ? [] : [
                "",
                "**Flags**:",
                flags
            ])
        ].join("\n"), false);

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
