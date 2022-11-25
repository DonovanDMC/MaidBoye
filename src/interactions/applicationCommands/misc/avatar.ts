import Command from "../../../util/cmd/Command.js";
import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import { ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow, MessageFlags } from "oceanic.js";

export default new Command(import.meta.url, "avatar")
    .setDescription("Get someone's avatar..")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to get the avatar of")
            .finalizeOption()
    )
    .setOptionsParser(interaction => ({
        user: interaction.data.options.getUser("user") || interaction.user
    }))
    .setAck((interaction, { user }, ephemeralUser) => {
        if (!user) {
            return interaction.reply({
                flags:   MessageFlags.EPHEMERAL,
                content: "H-hey! That wasn't a valid user.."
            });
        }
        return ephemeralUser ? interaction.defer(MessageFlags.EPHEMERAL) : interaction.defer();
    })
    .setCooldown(3e3)
    .setExecutor(async function(interaction, { user }) {
        const c = new ComponentBuilder<MessageActionRow>();
        c.addURLButton({
            label: "Open Externally",
            url:   user.avatarURL()
        });
        if (user.id === this.user.id) {
            c.addURLButton({
                label: "Open Sauce",
                url:   Config.botSauce
            });
        }

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setDescription(user.id === this.user.id ? `If you want to see the full version of my avatar, you can see it [here](${Config.botSauce}).` : "")
                .setTitle(`Avatar of ${user.tag}`)
                .setImage(user.avatarURL())
                .toJSON(true),
            components: c.toJSON()
        });
    });
