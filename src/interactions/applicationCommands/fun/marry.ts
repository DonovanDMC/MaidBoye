import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import Yiffy from "../../../util/req/Yiffy.js";
import Util from "../../../util/Util.js";
import Config from "../../../config/index.js";
import { State } from "../../../util/State.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";


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
        const other = await UserConfig.get(member.id);
        if (uConfig.marriagePartners.includes(member.id)) {
            return interaction.reply({
                content:         `H-hey! You're already married to <@!${member.id}>..`,
                flags:           MessageFlags.EPHEMERAL,
                allowedMentions: {
                    users: false
                }
            });
        }

        const img = await Yiffy.furry.propose("json", 1);

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Marriage Proposal")
                .setDescription(`<@!${interaction.user.id}> has proposed to <@!${member.id}>!\n<@!${member.id}> do you accept?`)
                .setImage(img.url)
                .setFooter(`${member.tag} Is Marred To ${other.marriagePartners.length} People.`, Config.botIcon)
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
