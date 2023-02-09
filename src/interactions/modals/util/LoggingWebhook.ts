import { LogEvents } from "../../../db/Models/LogEvent.js";
import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import { enableLogging } from "../../applicationCommands/util/logging.js";
import WebhookModal from "../structure/Webhook.js";
import type { Webhook } from "oceanic.js";

export default class LoggingWebhookModal extends WebhookModal {
    command = "logging";

    override doAfter(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; event: LogEvents; }): Promise<void> {
        return enableLogging(interaction, state.channel, webhook, state.event);
    }

    override getReason(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, state: BaseState & { event: LogEvents; }): string {
        return `Logging for ${Util.readableConstant(LogEvents[state.event])} (${interaction.user.tag})`;
    }
}
