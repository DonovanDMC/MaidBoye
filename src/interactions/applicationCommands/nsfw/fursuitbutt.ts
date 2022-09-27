import Command from "../../../util/cmd/Command.js";
import Yiffy from "../../../util/req/Yiffy.js";
import Util from "../../../util/Util.js";
import { Colors } from "../../../util/Constants.js";
import { State } from "../../../util/State.js";
import { ComponentBuilder, ButtonColors } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default new Command(import.meta.url, "fursuitbutt")
    .setDescription("Get an image of a fursuit butt")
    .setRestrictions("nsfw")
    .setAck("ephemeral-user")
    .setCooldown(1e4)
    .setExecutor(async function(interaction) {
        const img = await Yiffy.furry.butts("json", 1);
        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Fursuit Butt")
                .setImage(img.url)
                .setColor(Colors.gold)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>(3)
                .addURLButton({
                    label: "Full Image",
                    url:   img.shortURL
                })
                .addURLButton({
                    disabled: img.sources.length === 0,
                    label:    "Source",
                    url:      img.sources[0] || "https://yiff.rest"
                })
                .addURLButton({
                    disabled: !img.reportURL,
                    label:    "Report",
                    url:      img.reportURL || "https://report.yiff.media"
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "fursuitbutt", "new").encode(),
                    label:    "New Image",
                    style:    ButtonColors.GREY
                })
                .addInteractionButton({
                    customID: State.partialExit(),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        });
    });
