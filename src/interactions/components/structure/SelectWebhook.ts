import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import type { Webhook } from "oceanic.js";

export default abstract class SelectWebhookComponent extends BaseComponent {
    action = "select-webhook";
    abstract doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState): Promise<void>;

    override async handleGuild(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, state: BaseState & { channel: string; }) {
        const webhook = await interaction.client.rest.webhooks.get(interaction.data.values.getStrings()[0]);
        if (!webhook.token) {
            return interaction.editParent({
                content: "Something broke.."
            });
        }

        return this.doAfter(interaction, webhook, state);
    }
}
