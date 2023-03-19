import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "impostor")
    .setDescription("amogus")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("The sus")
    )
    .setOptionsParser(interaction => ({
        text: interaction.data.options.getString("text") || interaction.user.mention
    }))
    .setExecutor(async function(interaction, { text }) {
        return interaction.reply({
            content: [
                "。　　　　•　    　ﾟ　　。",
                " 　　.　　　.　　　  　　.　　　　　。　　   。　.",
                " 　.　　      。　        ඞ   。　    .    •",
                `    •                ${text} was ${Math.random() > .5 ? "not The" : "An"} Impostor.   。  .`,
                "　 　　。　　 　　　　ﾟ　　　.　    　　　."
            ].join("\n"),
            allowedMentions: {
                users: false
            }
        });
    });
