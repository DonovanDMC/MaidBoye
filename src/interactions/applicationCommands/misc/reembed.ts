import { MessageCommand } from "../../../util/cmd/OtherCommand.js";
import { type Message, MessageFlags } from "oceanic.js";


export const messageCommand = new MessageCommand(import.meta.url, "Unsuppress Embeds")
    .setAck("ephemeral")
    .setExecutor(async function (interaction) {
        const message = interaction.data.target as Message;
        if ((message.flags & MessageFlags.SUPPRESS_EMBEDS) !== MessageFlags.SUPPRESS_EMBEDS) {
            return interaction.reply({
                content: "This message does not have embeds suppressed."
            });
        }

        await message.edit({
            flags: message.flags & ~MessageFlags.SUPPRESS_EMBEDS
        });

        return interaction.reply({
            content: "Embeds have been unsuppressed."
        });
    });
