import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AutoModerationActionTypeDescriptions, AutoModerationTriggerTypeNames } from "../util/Names.js";
import { type AnyTextableGuildChannel, Guild, User } from "oceanic.js";
import { Strings } from "@uwu-codes/utils";

export default new ClientEvent("autoModerationActionExecution", async function autoModerationActionExecutionEvent(guild, channel, user, options) {
    if (!(guild instanceof Guild)) {
        return;
    }
    const events = await LogEvent.getType(guild.id, LogEvents.AUTOMOD_ACTION_EXECUTION);
    if (events.length === 0) {
        return;
    }

    const rule = options.rule ?? guild.autoModerationRules.get(options.ruleID) ?? await guild.getAutoModerationRule(options.ruleID);
    if (!(user instanceof User)) {
        user = (await this.getUser(user.id))!;
    }
    channel = channel === null ? null : (await this.getGuildChannel(channel.id))!;
    const embed = Util.makeEmbed(true)
        .setTitle("Auto Moderation Action Executed")
        .setColor(Colors.red)
        .addField("Execution Info", [
            `Action: ${AutoModerationActionTypeDescriptions[options.action.type](options.action)}`,
            `Rule: **${rule.name}** (${rule.id})`,
            `Trigger Type: **${AutoModerationTriggerTypeNames[options.ruleTriggerType]}**`,
            `User: **${(user as User).tag}** (${user.id})`,
            ...(channel ? [`Channel: **${(channel as AnyTextableGuildChannel).name}** (${channel.id})`] : [])
        ].join("\n"), false)
        .addField("Content", Strings.truncateWords(options.content, 1024), false)
        .addField("Matched Content", Strings.truncateWords(options.matchedContent, 1024), false);

    if (options.matchedKeyword !== null) {
        embed.addField("Matched Keyword", options.matchedKeyword, false);
    }

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
