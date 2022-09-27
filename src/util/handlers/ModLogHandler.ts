import TimedModerationHandler from "./TimedModerationHandler.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import type MaidBoye from "../../main";
import UserConfig from "../../db/Models/UserConfig.js";
import Logger from "../Logger.js";
import type { ModLogCreationData } from "../../db/Models/ModLog.js";
import ModLog, { ModLogType } from "../../db/Models/ModLog.js";
import Util from "../Util.js";
import Config from "../../config/index.js";
import { Colors } from "../Constants.js";
import type Timed from "../../db/Models/Timed.js";
import { TimedType } from "../../db/Models/Timed.js";
import Strike, { StrikeType } from "../../db/Models/Strike.js";
import type {
    AnyOptions,
    BanOptions,
    ClearWarningsOptions,
    CreateEntryResultStrikeTimed,
    CreateEntryResultStrike,
    CreateEntryResultNeither,
    DeleteWarningOptions,
    KickOptions,
    LockdownOptions,
    LockOptions,
    MuteOptions,
    SoftbanOptions,
    StrikeOptions,
    UnbanOptions,
    UnlockdownOptions,
    UnlockOptions,
    UnmuteOptions,
    WarningOptions
} from "../@types/modlog.js";
import Warning from "../../db/Models/Warning.js";
import { Time } from "@uwu-codes/utils";
import { Guild, Member, User } from "oceanic.js";
import { randomUUID } from "crypto";

export default class ModLogHandler {
    static client: MaidBoye;

    static async check(gConfig: GuildConfig) {
        if (gConfig.modlog.enabled) {
            if (gConfig.modlog.webhook === null) {
                await gConfig.setSetting("MODLOG_ENABLED", false);
                await gConfig.setSetting("WEBHOOK_MANAGED", false);
                return false;
            }

            if (!gConfig.modlog.webhook.id || !gConfig.modlog.webhook.token) {
                await gConfig.setSetting("MODLOG_ENABLED", false);
                await gConfig.setSetting("WEBHOOK_MANAGED", false);
                await gConfig.edit({
                    modlog_webhook_id:         null,
                    modlog_webhook_token:      null,
                    modlog_webhook_channel_id: null
                });
                return false;
            }

            const hook = await this.client.rest.webhooks.get(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token).catch(() => null);
            if (!hook) {
                await gConfig.setSetting("MODLOG_ENABLED", false);
                await gConfig.setSetting("WEBHOOK_MANAGED", false);
                await gConfig.edit({
                    modlog_webhook_id:         null,
                    modlog_webhook_token:      null,
                    modlog_webhook_channel_id: null
                });
                return false;
            }

            if (hook.applicationID !== this.client.user.id) {
                await gConfig.setSetting("WEBHOOK_MANAGED", false);
            }

            if (hook.channelID !== null && hook.channelID !== gConfig.modlog.webhook.channelID) {
                await gConfig.edit({
                    modlog_webhook_channel_id: hook.channelID
                });
            }
        }

        return gConfig.modlog.enabled;
    }

    static async createEntry(options: BanOptions | MuteOptions): Promise<CreateEntryResultStrikeTimed>;
    static async createEntry(options: SoftbanOptions | KickOptions | WarningOptions): Promise<CreateEntryResultStrike>;
    static async createEntry(options: UnbanOptions | UnmuteOptions | LockOptions | UnlockOptions | LockdownOptions | UnlockdownOptions | DeleteWarningOptions | ClearWarningsOptions | StrikeOptions): Promise<CreateEntryResultNeither>;
    static async createEntry(options: AnyOptions) {
        const { type, gConfig, guild, blame, reason } = options;
        const check = await this.check(options.gConfig);
        if ("target" in options && (options.target instanceof User || options.target instanceof Member)) await UserConfig.createIfNotExists(options.target.id);
        const caseID = await ModLog.getNextID(gConfig.id);
        const data: ModLogCreationData = {
            type:      ModLogType.BAN,
            case_id:   caseID,
            guild_id:  options.guild.id,
            target_id: "target" in options ? options.target.id : null,
            blame_id:  options.blame?.id,
            reason:    options.reason
        };
        let text: string, color: number, timed: Timed | null = null, strike: Strike | null = null;
        switch (type) {
            case ModLogType.BAN: {
                const { target, time, deleteSeconds } = options;
                if (time > 0) timed = await TimedModerationHandler.add(TimedType.BAN, guild.id, target.id, time);
                data.delete_seconds = deleteSeconds;
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`,
                    `Message Delete Hours: **${deleteSeconds * 60}**`,
                    `Time: ${!timed ? "Permanent" : `${Time.ms(time, { words: true, seconds: true })} (expiry: ${Util.formatDiscordTime(timed.expiresAt.getTime(), "long-datetime")})`}`
                ].join("\n");
                strike = await Strike.create({
                    id:       randomUUID(),
                    guild_id: guild.id,
                    user_id:  target.id,
                    blame_id: blame?.id || null,
                    type:     StrikeType.BAN
                });
                color = Colors.red;
                break;
            }

            case ModLogType.UNBAN: {
                const { target } = options;
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.green;
                break;
            }

            case ModLogType.SOFTBAN: {
                const { target, deleteSeconds } = options;
                data.delete_seconds = deleteSeconds;
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`,
                    `Message Delete Hours: **${deleteSeconds * 60}**`
                ].join("\n");
                color = Colors.red;
                break;
            }

            case ModLogType.MUTE: {
                const { target, time } = options;
                // Discord only allows up to 28 days via api
                if (time > 0) timed = await TimedModerationHandler.add(TimedType.MUTE, guild.id, target.id, time);
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`,
                    `Time: ${!timed ? "Permanent" : `${Time.ms(time, { words: true, seconds: true })} (expiry: ${Util.formatDiscordTime(timed.expiresAt.getTime(), "long-datetime")})`}`
                ].join("\n");
                strike = await Strike.create({
                    id:       randomUUID(),
                    guild_id: guild.id,
                    user_id:  target.id,
                    blame_id: blame?.id || null,
                    type:     StrikeType.MUTE
                });
                color = Colors.red;
                break;
            }

            case ModLogType.UNMUTE: {
                const { target } = options;
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.green;
                break;
            }

            case ModLogType.KICK: {
                const { target } = options;
                text = [
                    `Target: <@!${target.id}> (\`${target.tag}\`)`,
                    `Reason: ${reason}`
                ].join("\n");
                strike = await Strike.create({
                    id:       randomUUID(),
                    guild_id: guild.id,
                    user_id:  target.id,
                    blame_id: blame?.id || null,
                    type:     StrikeType.KICK
                });
                color = Colors.red;
                break;
            }

            case ModLogType.LOCK: {
                const { target } = options;
                text = [
                    `Target: <#${target.id}> (\`${target.id}\`)`,
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.red;
                break;
            }

            case ModLogType.UNLOCK: {
                const { target } = options;
                text = [
                    `Target: <#${target.id}> (\`${target.id}\`)`,
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.green;
                break;
            }

            case ModLogType.LOCKDOWN: {
                text = [
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.red;
                break;
            }

            case ModLogType.UNLOCKDOWN: {
                text = [
                    `Reason: ${reason}`
                ].join("\n");
                color = Colors.green;
                break;
            }

            case ModLogType.WARNING: {
                const { target, warningID } = options;
                const warning = await Warning.get(warningID);
                data.warning_id = warningID;
                text = [
                    `Target: <@${target.id}> (\`${target.tag}\`)`,
                    `Reason: **${reason}**`,
                    `Warning Id: **${warning?.id || "Unknown"}**`
                ].join("\n");
                strike = await Strike.create({
                    id:       randomUUID(),
                    guild_id: guild.id,
                    user_id:  target.id,
                    blame_id: blame?.id || null,
                    type:     StrikeType.WARNING
                });
                color = Colors.red;
                break;
            }

            case ModLogType.DELETE_WARNING: {
                const { target, warningID } = options;
                text = [
                    `Target: <@${target.id}> (\`${target.tag}\`)`,
                    `Reason: **${reason}**`,
                    `Warning Id: **${warningID}**`
                ].join("\n");
                color = Colors.orange;
                break;
            }

            case ModLogType.CLEAR_WARNINGS: {
                const { target, amount } = options;
                text = [
                    `Target: <@${target.id}> (\`${target.tag}\`)`,
                    `Reason: **${reason}**`,
                    `Total Removed: **${amount}**`
                ].join("\n");
                color = Colors.green;
                break;
            }

            case ModLogType.STRIKE: {
                const { target, amount } = options;
                text = [
                    `Target: <@${target.id}> (\`${target.tag}\`)`,
                    `Reason: **${reason}**`,
                    `Amount: **${amount}**`
                ].join("\n");
                color = Colors.red;
                break;
            }

            default: throw new Error(`Unhandled modlog type: ${type as number} (${JSON.stringify(options)})`);
        }

        const msg = await this.executeWebhook(guild, gConfig, blame, ModLogType.BAN, caseID, color, text);

        data.channel_id = msg?.channelID;
        data.message_id = msg?.id;
        if (timed) data.timed_id = timed.id;
        if (strike) data.strike_id = strike.id;

        const log = await ModLog.create(data);

        return { entry: log, message: msg, timed, strike, caseID, active: check } as unknown;
    }

    static async executeWebhook(guild: Guild, gConfig: GuildConfig, blame: User | Member | null, type: ModLogType, caseID: number, color: number, description: string, title?: string) {
        const titles = {
            [ModLogType.BAN]:            "User Banned",
            [ModLogType.UNBAN]:          "User Unbanned",
            [ModLogType.SOFTBAN]:        "User Softbanned",
            [ModLogType.MUTE]:           "User Muted",
            [ModLogType.UNMUTE]:         "User Unmuted",
            [ModLogType.KICK]:           "User Kicked",
            [ModLogType.LOCK]:           "Channel Locked",
            [ModLogType.UNLOCK]:         "Channel Unlocked",
            [ModLogType.LOCKDOWN]:       "Lockdown Started",
            [ModLogType.UNLOCKDOWN]:     "Lockdown Ended",
            [ModLogType.WARNING]:        "User Warned",
            [ModLogType.DELETE_WARNING]: "User Warning Removed",
            [ModLogType.CLEAR_WARNINGS]: "User Warnings Cleared",
            [ModLogType.STRIKE]:         "User Strike Given"
        };
        if (!(await this.check(gConfig))) return null;
        return this.client.rest.webhooks.execute(gConfig.modlog.webhook!.id, gConfig.modlog.webhook!.token, {
            ...{
                embeds: Util.makeEmbed(false)
                    .setAuthor(guild.name, guild.iconURL() ?? undefined)
                    .setTitle(title || `${titles[type] || `Unknown Case Type (${type})`} | Case #${caseID}`)
                    .setDescription(description)
                    .setColor(color)
                    .setFooter(`Action Performed ${!blame ? "Automatically" : `By ${blame.tag}`}`, blame === null ? Config.botIcon : blame.avatarURL())
                    .toJSON(true)
            },
            wait: true
        }).catch(() => null);
    }

    static async init(client: MaidBoye) {
        this.client = client;
        Logger.getLogger("ModLogHandler").info("Initialized");
    }
}
