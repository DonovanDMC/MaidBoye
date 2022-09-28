import Command from "../../../util/cmd/Command.js";
import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import { ApplicationCommandOptionTypes, MessageActionRow } from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";

export default new Command(import.meta.url, "8ball")
    .setDescription("Ask the magic 8 ball")
    .setCooldown(3e3)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "question")
            .setDescription("The question to ask the magic 8 ball")
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        question: interaction.data.options.getString("question", true)
    }))
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction, { question }) {
        const image = Config["8ballAnswers"][Math.floor(Math.random() * Config["8ballAnswers"].length)];
        await interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("8ball Question")
                .setDescription(`You Asked:\n\`\`\`\n${question}\`\`\`\nThe Magic 8Ball's Answer:`)
                .setImage(image)
                .setFooter("Disclaimer: Do not take any answers seriously!", Config.botIcon)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "8ball", "new").encode(),
                    label:    "New Answer",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.BLURPLE
                })
                .toJSON()
        });
    });
