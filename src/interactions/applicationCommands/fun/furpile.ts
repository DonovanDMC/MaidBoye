import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import db from "../../../db/index.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

export default new Command(import.meta.url, "furpile")
    .setDescription("Start a furpile on someone")
    .setCooldown(3e3)
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to flop start a furpile on")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUserOption("user", true)?.value
    }))
    .setAck(async function(interaction, options) {
        if (interaction.user.id === options.user) return interaction.reply({
            content: "H-hey! You can't start a furpile on yourself..",
            flags:   MessageFlags.EPHEMERAL
        });
        return interaction.defer();
    })
    .setExecutor(async function(interaction, { user }) {
        await interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Active Furpile")
                .setDescription(`Furpile Started By: <@!${interaction.user.id}> on <@!${user}>\nCurrent Furs: **2**`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(null, "furpile", "join").with("starter", interaction.user.id).with("secondary", user).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.custom.furdancing, "custom"),
                    label:    "Join Furpile",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
        const msg = await interaction.getOriginal();
        await db.redis.del(`furpile:${interaction.channel.id}:${interaction.user.id}`);
        await db.redis.sadd(`furpile:${interaction.channel.id}:${interaction.user.id}`, interaction.user.id, user);
        await db.redis.set(`furpile:${interaction.channel.id}:${interaction.user.id}:message`, msg.id);
    });
