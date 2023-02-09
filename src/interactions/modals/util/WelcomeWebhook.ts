import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import WebhookModal from "../structure/Webhook.js";
import { enableWelcome } from "../../applicationCommands/util/welcome.js";
import type { Webhook } from "oceanic.js";

export default class WelcomeWebhookModal extends WebhookModal {
    command = "welcome";

    override async doAfter(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; }) {
        return enableWelcome(interaction, state.channel, webhook);
    }

    override getReason(interaction: ModalSubmitInteraction<ValidLocation.GUILD>) {
        return `Welcome message (${interaction.user.tag})`;
    }
}
