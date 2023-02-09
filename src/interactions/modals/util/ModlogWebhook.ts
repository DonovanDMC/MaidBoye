import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import WebhookModal from "../structure/Webhook.js";
import { enableModlog } from "../../applicationCommands/mod/modlog.js";
import type { Webhook } from "oceanic.js";

export default class ModlogWebhookModal extends WebhookModal {
    command = "modlog";

    override async doAfter(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; }) {
        return enableModlog(interaction, state.channel, webhook);
    }

    override getReason(interaction: ModalSubmitInteraction<ValidLocation.GUILD>) {
        return `ModLog (${interaction.user.tag})`;
    }
}
