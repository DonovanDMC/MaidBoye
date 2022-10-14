import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AutoModerationActionTypeNames, AutoModerationTriggerTypeNames } from "../util/Names.js";
import { AnyGuildTextChannel, AutoModerationActionTypes, Guild, User } from "oceanic.js";
import { Strings, Time } from "@uwu-codes/utils";

export default new ClientEvent("autoModerationActionExecution", async function autoModerationActionExecutionEvent(guild, channel, user, options) {
    if (!(guild instanceof Guild)) return;
    const events = await LogEvent.getType(guild.id, LogEvents.AUTOMOD_ACTION_EXECUTION);
    if (events.length === 0) return;

    const rule = options.rule ?? guild.autoModerationRules.get(options.ruleID) ?? await guild.getAutoModerationRule(options.ruleID);
    if (!(user instanceof User)) user = (await this.getUser(user.id))!;
    channel = channel === null ? null : (await this.getGuildChannel(channel.id))!;
    let actionInfo = "";
    switch (options.action.type) {
        case AutoModerationActionTypes.BLOCK_MESSAGE: {
            actionInfo = `${AutoModerationActionTypeNames[options.action.type]}`; break;
        }
        case AutoModerationActionTypes.SEND_ALERT_MESSAGE: {
            actionInfo = `${AutoModerationActionTypeNames[options.action.type]} - <#${options.action.metadata.channelID}>`; break;
        }
        case AutoModerationActionTypes.TIMEOUT: {
            actionInfo = `${AutoModerationActionTypeNames[options.action.type]} - ${Time.ms(options.action.metadata.durationSeconds * 1000, { words: true })}`; break;
        }
    }
    const embed = Util.makeEmbed(true)
        .setTitle("Auto Moderation Action Executed")
        .setColor(Colors.red)
        .addField("Execution Info", [
            `Action: ${actionInfo}`,
            `Rule: **${rule.name}** (${rule.id})`,
            `Trigger Type: **${AutoModerationTriggerTypeNames[options.ruleTriggerType]}**`,
            `User: **${(user as User).tag}** (${user.id})`,
            ...(channel ? [`Channel: **${(channel as AnyGuildTextChannel).name}** (${channel.id})`] : [])
        ].join("\n"), false)
        .addField("Content", Strings.truncateWords(options.content, 1024), false)
        .addField("Matched Content", Strings.truncateWords(options.matchedContent, 1024), false);

    if (options.matchedKeyword !== null) embed.addField("Matched Keyword", options.matchedKeyword, false);

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
