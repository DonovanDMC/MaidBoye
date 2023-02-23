import Command from "../../../util/cmd/Command.js";
import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import { UserCommand } from "../../../util/cmd/OtherCommand.js";
import { ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, type MessageActionRow, MessageFlags, type User } from "oceanic.js";

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
        const member = "guild" in interaction ? interaction.guild.members.get(user.id) : undefined;
        const c = new ComponentBuilder<MessageActionRow>();
        if (member) {
            c.addURLButton({
                label: "Open Server",
                url:   member.avatarURL()
            });
            c.addURLButton({
                label: "Open Global",
                url:   user.avatarURL()
            });
        } else {
            c.addURLButton({
                label: "Open Externally",
                url:   user.avatarURL()
            });
        }
        if (user.id === this.user.id) {
            c.addURLButton({
                label: "Open Sauce",
                url:   Config.botSauce
            });
        }

        const e = Util.makeEmbed(true, interaction.user)
            .setDescription(user.id === this.user.id ? `If you want to see the full version of my avatar, you can see it [here](${Config.botSauce}).` : (member ? "The user's global avatar is in the top right." : ""))
            .setTitle(`Avatar of ${user.tag}`)
            .setImage((member ?? user).avatarURL());
        if (member) {
            e.setThumbnail(user.avatarURL());
        }
        return interaction.reply({
            embeds: e
                .toJSON(true),
            components: c.toJSON()
        });
    });

export const userCommand = new UserCommand(import.meta.url, "avatar")
    .setDescription("Get someone's avatar..")
    .setAck(async function (interaction) {
        const user = interaction.data.target as User;
        const member = "guild" in interaction ? interaction.guild.members.get(user.id) : undefined;
        const c = new ComponentBuilder<MessageActionRow>();
        if (member) {
            c.addURLButton({
                label: "Open Server",
                url:   member.avatarURL()
            });
            c.addURLButton({
                label: "Open Global",
                url:   user.avatarURL()
            });
        } else {
            c.addURLButton({
                label: "Open Externally",
                url:   user.avatarURL()
            });
        }
        if (user.id === this.user.id) {
            c.addURLButton({
                label: "Open Sauce",
                url:   Config.botSauce
            });
        }

        const e = Util.makeEmbed(true, interaction.user)
            .setDescription(user.id === this.user.id ? `If you want to see the full version of my avatar, you can see it [here](${Config.botSauce}).` : (member ? "The user's global avatar is in the top right." : ""))
            .setTitle(`Avatar of ${user.tag}`)
            .setImage((member ?? user).avatarURL());
        if (member) {
            e.setThumbnail(user.avatarURL());
        }
        return interaction.reply({
            embeds:     e.toJSON(true),
            components: c.toJSON()
        });
    });
