import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import db from "../../../db/index.js";
import Config from "../../../config/index.js";
import { MessageFlags } from "oceanic.js";

export default class FurpileComponent extends BaseComponent {
    action = "join";
    command = "furpile";

    override async handleGuild(interaction: ComponentInteraction, { starter, secondary }: BaseState & { secondary: string; starter: string; }) {
        const exists = await db.redis.exists(`furpile:${interaction.channelID}:${starter}`);
        if (!exists) {
            await db.redis.del(`furpile:${interaction.channelID}:${starter}:message`);
            await interaction.editOriginal(Util.replaceContent({
                embeds: Util.makeEmbed()
                    .setTitle("Furpile Ended")
                    .setDescription(interaction.message.embeds[0]!.description!)
                    .toJSON(true)
            }));
            return;
        }

        const members = await db.redis.smembers(`furpile:${interaction.channelID}:${starter}`);
        if (members.includes(interaction.user.id)) {
            await interaction.reply({
                content: "You are already in this furpile!",
                flags:   MessageFlags.EPHEMERAL
            });
        } else {
            members.push(interaction.user.id);
            await db.redis.sadd(`furpile:${interaction.channelID}:${starter}`);
            await interaction.editParent({
                embeds: Util.makeEmbed(true, undefined, interaction.message.embeds[0]!)
                    .setDescription(`Furpile Started By: <@!${starter}> with <@!${secondary}>\nCurrent Furs: **${members.length}**\n${Config.emojis.custom.furdancing.repeat(Math.min(members.length, 10))}\n${members.slice(2).map((c, i) => `<@!${c}> joined a furpile with **${i + 1}** furs`).join("\n")}`)
                    .toJSON(true)
            });

        }
    }
}
