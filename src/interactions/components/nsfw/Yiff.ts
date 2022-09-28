import BaseComponent from "../structure/BaseComponent.js";
import type { YiffTypes } from "../../../db/Models/UserConfig.js";
import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { State } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import { Colors } from "../../../util/Constants.js";
import { Strings } from "@uwu-codes/utils";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";

export default class YiffComponent extends BaseComponent {
    action = "new";
    command = "yiff";

    protected override async handle(interaction: ComponentInteraction, data: BaseState & { type: YiffTypes; }) {
        const img = await Util.getYiff(data.type);
        await interaction.editParent({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle(`${Strings.ucwords(data.type)} Yiff!`)
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
                    customID: State.new(interaction.user.id, "yiff", "new").with("type", data.type).encode(),
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
