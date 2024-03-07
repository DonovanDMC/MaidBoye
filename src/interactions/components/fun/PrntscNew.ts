import Util from "../../../util/Util.js";
import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import { getWorking } from "../../applicationCommands/fun/prntsc.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class PrntscNewComponent extends BaseComponent {
    action = "new";
    command = "prntsc";

    protected override async handle(interaction: ComponentInteraction) {
        const data = await getWorking();

        void interaction.editOriginal({
            embeds: Util.makeEmbed(true, interaction.user)
                .setImage(data.link)
                .setURL(data.shortLink)
                .setDescription(`${data.shortLink}\nWe are not responsible for the contents of this message. The code is randomly generated.`)
                .toJSON(true)
        });
    }
}
