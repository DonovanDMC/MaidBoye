import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import { enableAutoposting } from "../../applicationCommands/util/autoposting.js";
import type { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";

export default class AutoPostingSelectWebhookComponent extends BaseComponent {
    action = "select-webhook";
    command = "autoposting";

    override async handleGuild(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, { channel, time, type }: BaseState & { channel: string; time: number; type: AutoPostingTypes; }) {
        const webhook = await interaction.client.rest.webhooks.get(interaction.data.values.getStrings()[0]);
        if (!webhook.token) {
            return interaction.editParent({
                content: "Something broke.."
            });
        }

        return enableAutoposting(interaction, channel, webhook, type, time);
    }
}
