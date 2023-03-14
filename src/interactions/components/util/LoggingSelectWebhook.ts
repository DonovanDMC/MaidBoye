import { LogEvents } from "../../../db/Models/LogEvent.js";
import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { enableLogging } from "../../applicationCommands/util/logging.js";
import SelectWebhookComponent from "../structure/SelectWebhook.js";
import db from "../../../db/index.js";
import type { AnyGuildChannelWithoutThreads, Webhook } from "oceanic.js";

export default class LoggingSelectWebhookComponent extends SelectWebhookComponent {
    command = "logging";


    override async doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; event: LogEvents; }) {
        if (state.event === LogEvents.INVITE_TRACKING) {
            const channel = interaction.client.getChannel<AnyGuildChannelWithoutThreads>(state.channel);
            if (channel === undefined) {
                return interaction.reply({
                    content: "An internal error occured."
                });
            }
            if (!interaction.guild.clientMember.permissions.has("MANAGE_GUILD")) {
                return interaction.reply({
                    content: "H-hey! I need the **Manage Server** permission to enable invite tracking.."
                });
            }

            const invites = await interaction.guild.getInvites();
            await db.redis.mset(invites.flatMap(i => [`invites:${interaction.guildID}:${i.code}`, i.uses]));
        }
        return enableLogging(interaction, state.channel, webhook, state.event);
    }
}
