import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import Config from "../config/index.js";
import { Colors } from "../util/Constants.js";
import DailyGuildsHandler from "../util/handlers/DailyGuildsHandler.js";
import db from "../db/index.js";
import { EmbedBuilder } from "@oceanicjs/builders";
import { setTimeout } from "node:timers/promises";

export default new ClientEvent("guildCreate", async function guildCreateEvent(guild) {
    await setTimeout(2000);
    await DailyGuildsHandler.trackJoin();
    Logger.getLogger("GuildCreate").info(`Joined guild ${guild.name} (${guild.id})`);
    const owner = await this.getUser(guild.ownerID);
    const info = await db.redis.get(`invites:${guild.id}`);
    let infoText = "";
    if (info !== null) {
        const parsed = JSON.parse(info) as {
            permissions: string;
            source: string | null;
            user: string | null;
        };
        const inviter = parsed.user === null ? null : await this.getUser(parsed.user);
        infoText = [
            "",
            "**Invite Info**:",
            `${Config.emojis.default.dot} Inviter: ${inviter === null ? "Unknown" : `${inviter.tag} (${inviter.id})`}`,
            `${Config.emojis.default.dot} Source: ${parsed.source === null ? "Unknown" : parsed.source}`,
            `${Config.emojis.default.dot} Permissions: ${parsed.permissions}`
        ].join("\n");
    }
    await WebhookHandler.execute("guilds", {
        embeds: new EmbedBuilder()
            .setAuthor(owner === null ? "Unknown#0000" : owner.tag, owner?.avatarURL() ?? Config.noIcon)
            .setTitle("Guild Joined")
            .setDescription([
                `Guild #${this.guilds.size}`,
                "",
                "**Guild Info**:",
                `${Config.emojis.default.dot} Name: ${guild.name}`,
                `${Config.emojis.default.dot} ID: ${guild.id}`,
                `${Config.emojis.default.dot} Owner: ${owner === null ? "Unknown#0000" : owner.tag}`,
                `${Config.emojis.default.dot} Members: ${guild.memberCount} (Large: ${guild.large ? "Yes" : "no"})`,
                `${Config.emojis.default.dot} Channels: ${guild.channels.size}`,
                infoText
            ])
            .setImage(guild.iconURL() ?? Config.noIcon)
            .setColor(Colors.green)
            .toJSON(true)
    });
});
