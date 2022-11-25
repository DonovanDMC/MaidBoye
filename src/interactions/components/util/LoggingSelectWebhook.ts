import type { LogEvents } from "../../../db/Models/LogEvent.js";
import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import { enableLogging } from "../../applicationCommands/util/logging.js";

export default class LoggingSelectWebhookComponent extends BaseComponent {
    action = "select-webhook";
    command = "logging";

    override async handleGuild(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, { channel, event }: BaseState & { channel: string; event: LogEvents; }) {
        const webhook = await interaction.client.rest.webhooks.get(interaction.data.values.getStrings()[0]);
        if (!webhook.token) {
            return interaction.editParent({
                content: "Something broke.."
            });
        }

        return enableLogging(interaction, channel, webhook, event);
    }
}
