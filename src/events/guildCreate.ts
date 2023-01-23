import ClientEvent from "../util/ClientEvent.js";
import Logger from "../util/Logger.js";
import WebhookHandler from "../util/handlers/WebhookHandler.js";
import Config from "../config/index.js";
import { Colors } from "../util/Constants.js";
import DailyGuildsHandler from "../util/handlers/DailyGuildsHandler.js";
import { EmbedBuilder } from "@oceanicjs/builders";

export default new ClientEvent("guildCreate", async function guildCreateEvent(guild) {
    await DailyGuildsHandler.trackJoin();
    Logger.getLogger("GuildCreate").info(`Joined guild ${guild.name} (${guild.id})`);
    const owner = await this.getMember(guild.id, guild.ownerID);
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
                `${Config.emojis.default.dot} Channels: ${guild.channels.size}`
            ])
            .setImage(guild.iconURL() ?? Config.noIcon)
            .setColor(Colors.green)
            .toJSON(true)
    });
});
