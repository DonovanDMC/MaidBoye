import Command from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { Time } from "@uwu-codes/utils";

export default new Command(import.meta.url, "ping")
    .setDescription("Get some of my important links")
    .setAck("ephemeral-user")
    .setCooldown(3e3)
    .setExecutor(async function(interaction) {
        const shard = interaction.guildID === undefined ? interaction.client.shards.first()! : interaction.guild.shard;
        await interaction.reply(Util.replaceContent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Pong!")
                .setDescription(`${Config.emojis.default.paddle} Gateway: ${shard.latency} | REST: **${Time.ms(this.rest.handler.latencyRef.latency)}**`)
                .setFooter(`UwU | Shard: ${shard.id}`, Config.botIcon)
                .toJSON(true)
        }));
    });
