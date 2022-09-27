import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import db from "../../../db/index.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

export default new Command(import.meta.url, "conga")
    .setDescription("Start a conga with someone")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to start a conga with")
            .setRequired()
    )
    .setCooldown(3e3)
    .setValidLocation(ValidLocation.GUILD)
    .setOptionsParser(interaction => ({ user: interaction.data.options.getUserOption("user", true)?.value }))
    .setAck(async function(interaction, options) {
        if (interaction.user.id === options.user) {
            await interaction.reply({
                content: "H-hey! You can't start a conga with yourself..",
                flags:   MessageFlags.EPHEMERAL
            });
            return;
        }
        return interaction.defer();
    })
    .setExecutor(async function(interaction, { user }) {
        await interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Active Conga")
                .setDescription(`Conga Started By: <@!${interaction.user.id}> with <@!${user}>\n${Config.emojis.custom.furdancing}\nCurrent Furs: **2**`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(null, "conga", "join").with("starter", interaction.user.id).with("secondary", user).encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.custom.furdancing, "custom"),
                    label:    "Join Conga",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
        const msg = await interaction.getOriginal();
        await db.redis.del(`conga:${interaction.channel.id}:${interaction.user.id}`);
        await db.redis.sadd(`conga:${interaction.channel.id}:${interaction.user.id}`, interaction.user.id, user);
        await db.redis.set(`conga:${interaction.channel.id}:${interaction.user.id}:message`, msg.id);
    });
