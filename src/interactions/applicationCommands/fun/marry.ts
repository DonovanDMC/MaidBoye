import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import Yiffy from "../../../util/req/Yiffy.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { State } from "../../../util/State.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, type MessageActionRow, MessageFlags } from "oceanic.js";


export default new Command(import.meta.url, "marry")
    .setDescription("Marry someone!")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to marry")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        member: interaction.data.options.getMember("user", true)
    }))
    .setUserLookup(true)
    .setAck(async function(interaction, { member }) {
        if (interaction.user.id === member.id) {
            await interaction.reply({
                content: "H-hey! I know self love is important, but you've gotta try someone else..",
                flags:   MessageFlags.EPHEMERAL
            });
            return false;
        }
        if (member.bot) {
            await interaction.reply({
                content: "H-hey! You can't marry a bot..",
                flags:   MessageFlags.EPHEMERAL
            });
            return false;
        }
        return interaction.defer();
    })
    .setExecutor(async function(interaction, { member }, gConfig, uConfig) {
        if (uConfig.marriagePartners.length >= 5) {
            return interaction.reply({
                content: "H-hey! Polyamory is great and all, but surely there's a limit?",
                flags:   MessageFlags.EPHEMERAL
            });
        }
        if (uConfig.marriagePartners.includes(member.id)) {
            return interaction.reply({
                content:         `H-hey! You're already married to ${member.mention}..`,
                flags:           MessageFlags.EPHEMERAL,
                allowedMentions: {
                    users: false
                }
            });
        }

        const other = await UserConfig.get(member.id);
        if (other.marriagePartners.length >= 5) {
            return interaction.reply({
                content: "H-hey! They're already married to 5 or more people..",
                flags:   MessageFlags.EPHEMERAL
            });
        }

        const img = await Yiffy.images.furry.propose();

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Marriage Proposal")
                .setDescription(`${interaction.user.mention} has proposed to ${member.mention}!\n${member.mention} do you accept?`)
                .setImage(img.url)
                .setFooter(`${member.mention} is married to ${other.marriagePartners.length} ${other.marriagePartners.length === 1 ? "person" : "people"}.`, Config.botIcon)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(2)
                .addInteractionButton({
                    customID: State.new(member.id, "marry", "yes").with("partner", interaction.user.id).encode(),
                    label:    "Yes",
                    style:    ButtonColors.GREEN
                })
                .addInteractionButton({
                    customID: State.new(member.id, "marry", "no").with("partner", interaction.user.id).encode(),
                    label:    "No",
                    style:    ButtonColors.RED
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        });
    });
