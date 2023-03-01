import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import db from "../../../db/index.js";
import Config from "../../../config/index.js";
import { MessageFlags } from "oceanic.js";

export default class AwooComponent extends BaseComponent {
    action = "join";
    command = "awoo";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { starter }: BaseState & { starter: string; }) {
        const exists = await db.redis.exists(`awoo:${interaction.channel.id}:${starter}`);
        if (!exists) {
            await db.redis.del(`awoo:${interaction.channel.id}:${starter}:message`);
            await interaction.editOriginal(Util.replaceContent({
                embeds: Util.makeEmbed()
                    .setTitle("Howl Ended")
                    .setDescription(interaction.message.embeds[0]!.description!)
                    .toJSON(true)
            }));
            return;
        }

        const members = await db.redis.smembers(`awoo:${interaction.channel.id}:${starter}`);
        if (members.includes(interaction.user.id)) {
            await interaction.reply({
                content: "You are already in this howl!",
                flags:   MessageFlags.EPHEMERAL
            });
        } else {
            members.push(interaction.user.id);
            await db.redis.sadd(`awoo:${interaction.channel.id}:${starter}`, interaction.user.id);
            await interaction.editParent({
                embeds: Util.makeEmbed(true, undefined, interaction.message.embeds[0]!)
                    .setDescription(`Howl Started By: <@!${starter}>\nCurrent Furs: **${members.length}**\n${Config.emojis.custom.awoo.repeat(Math.min(members.length, 10))}\n${members.slice(1).map((c, i) => `<@!${c}> joined a howl with **${i + 1}** furs`).join("\n")}`)
                    .toJSON(true)
            });

        }
    }
}
