import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import { Colors } from "../../../util/Constants.js";
import Yiffy from "../../../util/req/Yiffy.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { MessageActionRow } from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";

export default class FursuitButtComponent extends BaseComponent {
    action = "new";
    command = "fursuitbutt";

    protected override async handle(interaction: ComponentInteraction) {
        const img = await Yiffy.furry.butts("json", 1);
        await interaction.editParent({
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
    }
}
