import Command from "../../../util/cmd/Command.js";
import { State } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { type MessageActionRow } from "oceanic.js";
import { random } from "mozuku";
type Print = Awaited<ReturnType<typeof random>>;

export async function getWorking(): Promise<Print> {
    let data;
    while (!data || data.isValid) {
        data = await random();
    }
    return data;
}

export default new Command(import.meta.url, "prntsc")
    .setDescription("Get a random screenshot from prnt.sc")
    .setRestrictions("nsfw")
    .setCooldown(3e3)
    .setExecutor(async function(interaction) {
        const data = await getWorking();

        return interaction.reply({
            embeds: Util.makeEmbed(true, interaction.user)
                .setImage(data.link)
                .setURL(data.shortLink)
                .setDescription(`${data.shortLink}\nWe are not responsible for the contents of this message. The code is randomly generated.`)
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "prntsc", "new").encode(),
                    label:    "New Image",
                    style:    ButtonColors.BLURPLE
                }).toJSON()
        });
    });
