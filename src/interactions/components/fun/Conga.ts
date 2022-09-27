import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import db from "../../../db/index.js";
import Config from "../../../config/index.js";
import { MessageFlags } from "oceanic.js";

export default class CongaComponent extends BaseComponent {
    action = "join";
    command = "conga";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { starter }: BaseState & { starter: string; }) {
        const exists = await db.redis.exists(`conga:${interaction.channel.id}:${starter}`);
        const og = await interaction.getOriginal();
        if (!exists) {
            await db.redis.del(`conga:${interaction.channel.id}:${starter}:message`);
            await interaction.editOriginal(Util.replaceContent({
                embeds: Util.makeEmbed()
                    .setTitle("Conga Ended")
                    .setDescription(og.embeds[0]!.description!)
                    .toJSON(true)
            }));
            return;
        }

        const members = await db.redis.smembers(`conga:${interaction.channel.id}:${starter}`);
        if (members.includes(interaction.user.id)) {
            await interaction.reply({
                content: "You are already in this conga!",
                flags:   MessageFlags.EPHEMERAL
            });
        } else {
            members.push(interaction.user.id);
            await db.redis.sadd(`conga:${interaction.channel.id}:${starter}`);
            await interaction.editParent({
                embeds: Util.makeEmbed(true, undefined, og.embeds[0]!)
                    .setDescription(`Conga Started By: <@!${starter}>\nCurrent Furs: **${members.length}**\n${Config.emojis.custom.furdancing.repeat(Math.min(members.length, 10))}\n${members.slice(1).map((c, i) => `<@!${c}> joined a conga with **${i + 1}** furs`).join("\n")}`)
                    .toJSON(true)
            });

        }
    }
}
