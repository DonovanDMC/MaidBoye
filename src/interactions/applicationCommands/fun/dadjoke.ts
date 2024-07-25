import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import { Colors } from "../../../util/Constants.js";
import { State } from "../../../util/State.js";
import { fetch } from "undici";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "dadjoke")
    .setDescription("Get a dadjoke")
    .setValidLocation(ValidLocation.BOTH)
    .setAck("ephemeral-user")
    .setExecutor(async function(interaction) {
        const { joke } = await fetch("https://icanhazdadjoke.com", {
            method:  "GET",
            headers: {
                "Accept":     "application/json",
                "User-Agent": Config.userAgent
            }
        }).then(v => v.json() as Promise<{ joke: string; }>);

        // sauce: https://e926.net/posts/1535420
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setDescription(joke)
                .setThumbnail("https://assets.maid.gay/dadjoke.png")
                .setColor(Colors.gold)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "dadjoke", "new").encode(),
                    label:    "New Joke",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        });
    });
