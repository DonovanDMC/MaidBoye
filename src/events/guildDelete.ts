import ClientEvent from "../util/ClientEvent.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import Config from "../config/index.js";
import { Colors } from "../util/Constants.js";
import DailyGuildsHandler from "../util/handlers/DailyGuildsHandler.js";
import Logger from "@uwu-codes/logger";
import { EmbedBuilder } from "@oceanicjs/builders";
import { Guild } from "oceanic.js";

export default new ClientEvent("guildDelete", async function guildDeleteEvent(guild) {
    await DailyGuildsHandler.trackLeave();
    if (!(guild instanceof Guild)) {
        Logger.getLogger("GuildDelete").error(`Left guild ${guild.id}`);
        return;
    }
    Logger.getLogger("GuildDelete").info(`Left guild ${guild.name} (${guild.id})`);
    const owner = await this.getUser(guild.ownerID);
    await WebhookHandler.execute("guilds", {
        embeds: new EmbedBuilder()
            .setAuthor(owner === null ? "Unknown#0000" : owner.tag, owner?.avatarURL() ?? Config.noIcon)
            .setTitle("Guild Left")
            .setDescription([
                `Guild #${this.guilds.size}`,
                "",
                "**Guild Info**:",
                `${Config.emojis.default.dot} Name: ${guild.name}`,
                `${Config.emojis.default.dot} ID: ${guild.id}`,
                `${Config.emojis.default.dot} Owner: ${owner === null ? "Unknown#0000" : owner.tag}`,
                `${Config.emojis.default.dot} Members: ${guild.memberCount} (Large: ${guild.large ? "Yes" : "no"})`,
                `${Config.emojis.default.dot} Channels: ${guild.channels.size}`
            ])
            .setImage(guild.iconURL() ?? Config.noIcon)
            .setColor(Colors.red)
            .toJSON(true)
    });
});
