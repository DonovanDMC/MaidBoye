import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import db from "../../../db/index.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "awoo")
    .setDescription("Start a howl")
    .setCooldown(3e3)
    .setValidLocation(ValidLocation.GUILD)
    .setExecutor(async function(interaction) {

        await interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Active Howl")
                .setDescription(`Howl Started By: <@!${interaction.user.id}>\n${Config.emojis.custom.awoo}\nCurrent Furs: **1**`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(null, "awoo", "join").with("starter", interaction.user.id).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.custom.awoo, "custom"),
                    label:    "Join Howl",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
        const msg = await interaction.getOriginal();
        await db.redis.del(`awoo:${interaction.channel.id}:${interaction.user.id}`);
        await db.redis.sadd(`awoo:${interaction.channel.id}:${interaction.user.id}`, interaction.user.id);
        await db.redis.set(`awoo:${interaction.channel.id}:${interaction.user.id}:message`, msg.id);
    });
