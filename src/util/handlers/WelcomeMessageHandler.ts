import GuildConfig from "../../db/Models/GuildConfig.js";
import type MaidBoye from "../../main";
import Util from "../Util.js";
import Logger from "@uwu-codes/logger";
import { MessageFlags, type Member, type AllowedMentions } from "oceanic.js";

export default class WelcomeMessageHandler {
    static client: MaidBoye;

    static async check(gConfig: GuildConfig) {
        if (gConfig.welcome.enabled) {
            if (gConfig.welcome.webhook === null) {
                await gConfig.resetWelcome();
                return false;
            }

            if (!gConfig.welcome.webhook.id || !gConfig.welcome.webhook.token) {
                await gConfig.resetWelcome();
                return false;
            }

            const hook = await this.client.rest.webhooks.get(gConfig.welcome.webhook.id, gConfig.welcome.webhook.token).catch(() => null);
            if (!hook) {
                await gConfig.resetWelcome();
                return false;
            }

            if (hook.applicationID !== this.client.user.id) {
                await gConfig.setSetting("WELCOME_WEBHOOK_MANAGED", false);
            }

            if (hook.channelID !== null && hook.channelID !== gConfig.welcome.webhook.channelID) {
                await gConfig.edit({
                    welcome_webhook_channel_id: hook.channelID
                });
            }
        }

        return gConfig.welcome.enabled;
    }

    static format(gConfig: GuildConfig, member: Member, type: "join" | "leave", content = type === "join" ? gConfig.welcome.joinMessage : gConfig.welcome.leaveMessage): { allowedMentions: AllowedMentions; content: string; flags: number;} {
        const map = Replacements(member);
        for (const [key, value] of Object.entries(map)) {
            content = content.replace(new RegExp(key, "g"), value);
        }

        let flags = 0;
        if (gConfig.welcome.modifiers.includes("SUPPRESS_EMBEDS")) {
            flags |= MessageFlags.SUPPRESS_EMBEDS;
        }
        if (gConfig.welcome.modifiers.includes("SUPPRESS_NOTIFICATIONS")) {
            flags |= MessageFlags.SUPPRESS_NOTIFICATIONS;
        }
        return {
            content,
            allowedMentions: {
                users:    !gConfig.welcome.modifiers.includes("DISABLE_USER_MENTIONS"),
                roles:    !gConfig.welcome.modifiers.includes("DISABLE_ROLE_MENTIONS"),
                everyone: !gConfig.welcome.modifiers.includes("DISABLE_EVERYONE_MENTIONS")
            },
            flags
        };
    }

    static async handle(member: Member, type: "join" | "leave", skipChecks = false) {
        const gConfig = await GuildConfig.get(member.guild.id);

        if (
            !await this.check(gConfig) || (!skipChecks && (
                (member.bot && gConfig.welcome.modifiers.includes("IGNORE_BOTS")) ||
                (type === "join" && !gConfig.welcome.modifiers.includes("JOIN_ENABLED")) ||
                (type === "leave" && !gConfig.welcome.modifiers.includes("LEAVE_ENABLED")) ||
                (member.pending && gConfig.welcome.modifiers.includes("WAIT_FOR_PASSING_MEMBER_GATE")) ||
                (!member.pending && !gConfig.welcome.modifiers.includes("WAIT_FOR_PASSING_MEMBER_GATE"))
            ))) {
            return false;
        }

        const msg = this.format(gConfig, member, type);
        await this.client.rest.webhooks.execute(gConfig.welcome.webhook!.id, gConfig.welcome.webhook!.token, msg);
        return true;
    }

    static async init(client: MaidBoye) {
        this.client = client;
        Logger.getLogger("WelcomeMessageHandler").info("Initialized");
    }
}

export const Replacements = (member: Member) => ({
    "{{user}}":               member.mention,
    "{{user.mention}}":       member.mention,
    "{{user.id}}":            member.id,
    "{{user.username}}":      member.username,
    "{{user.discriminator}}": member.discriminator,
    "{{user.tag}}":           member.tag,
    "{{user.avatar}}":        member.avatarURL(),
    "{{user.createdAt}}":     Util.formatDiscordTime(member.createdAt, "short-datetime"),
    "{{badges}}":             Util.formatBadges(member),
    "{{flags}}":              Util.formatFlags(member),
    "{{guild}}":              member.guild.name,
    "{{guild.name}}":         member.guild.name,
    "{{guild.id}}":           member.guild.id,
    "{{guild.createdAt}}":    Util.formatDiscordTime(member.guild.createdAt, "short-datetime"),
    "{{guild.memberCount}}":  member.guild.memberCount.toString()
});
