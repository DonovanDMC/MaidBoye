// import Util from "../../../util/Util.js";
import type { ComponentInteraction } from "../../../util/cmd/Command.js";
// import { prntsc } from "../../../util/prntsc.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class PrntscNewComponent extends BaseComponent {
    action = "new";
    command = "prntsc";

    protected override async handle(interaction: ComponentInteraction) {
        await interaction.reply({
            content: "This command has been disabled."
        });
        return;
        /* await interaction.deferUpdate();
        const data = await prntsc();

        void interaction.editOriginal({
            files: [
                {
                    name: `prntsc.${data.image.split(".").pop()}`,
                    contents: Buffer.from(await (await fetch(data.image)).arrayBuffer())
                }
            ],
            embeds: Util.makeEmbed(true, interaction.user)
                .setImage(`attachment://prntsc.${data.image.split(".").pop()}`)
                .setURL(data.link)
                .setDescription(`${data.link}\nWe are not responsible for the contents of this message. The code is randomly generated.`)
                .toJSON(true)
        }); */
    }
}
