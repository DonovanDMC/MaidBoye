import Command from "../../../util/cmd/Command.js";
import Config from "../../../config/index.js";
import { ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "links")
    .setDescription("Get some of my important links")
    .setAck("ephemeral-user")
    .setCooldown(3e3)
    .setExecutor(async function(interaction) {
        return interaction.reply({
            content:    "H-here's some links that might interest you!",
            components: new ComponentBuilder<MessageActionRow>(3)
                .addURLButton({
                    url:   Config.discordLink,
                    label: "Support Server"
                })
                .addURLButton({
                    url:   Config.twitterLink,
                    label: "Twitter"
                })
                .addURLButton({
                    url:   Config.webLink,
                    label: "Website"
                })
                .addURLButton({
                    url:   Config.devLink,
                    label: "Developer"
                })
                .addURLButton({
                    url:   Config.donationLink,
                    label: "Donate"
                })
                .addURLButton({
                    url:   Config.invLink,
                    label: "Invite"
                })
                .toJSON()
        });
    });
