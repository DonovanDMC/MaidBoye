import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "impostor")
    .setDescription("amogus")
    .setValidLocation(ValidLocation.GUILD)
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to sus")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "text")
            .setDescription("Any extra text")
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUserOption("user")?.value || interaction.user.id,
        text: interaction.data.options.getString("text")
    }))
    .setExecutor(async function(interaction, { user, text }) {
        return interaction.reply({
            content: [
                "。　　　　•　    　ﾟ　　。",
                " 　　.　　　.　　　  　　.　　　　　。　　   。　.",
                " 　.　　      。　        ඞ   。　    .    •",
                `    •                ${!text ? `<@!${user}>` : (user === interaction.user.id ? text : `<@!${user}> ${text}`)} was ${Math.random() > .5 ? "not The" : "An"} Impostor.   。  .`,
                "　 　　。　　 　　　　ﾟ　　　.　    　　　."
            ].join("\n"),
            allowedMentions: {
                users: false
            }
        });
    });
