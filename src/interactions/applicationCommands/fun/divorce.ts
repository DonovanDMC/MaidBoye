import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, type MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "divorce")
    .setDescription("Leave one of your partners.")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to divorce.")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user", true)
    }))
    .setUserLookup(true)
    .setExecutor(async function(interaction, { user }, gConfig, uConfig) {
        if (!uConfig.marriagePartners.includes(user.id)) {
            return interaction.reply({
                content: `H-hey! You aren't married to ${user.mention}...`
            });
        }


        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Divorce")
                .setDescription(`Are you sure you want to divorce ${user.mention}?`)
                .toJSON(true)
            ,
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "divorce", "yes").with("dUser", user.id).encode(),
                    label:    "Yes",
                    style:    ButtonColors.GREEN
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "divorce", "no").with("dUser", user.id).encode(),
                    label:    "No",
                    style:    ButtonColors.RED
                })
                .toJSON()
        });
    });
