import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import Util from "../../../util/Util.js";
import { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import { enableAutoposting } from "../../applicationCommands/util/autoposting.js";
import WebhookModal from "../structure/Webhook.js";
import type { Webhook } from "oceanic.js";

export default class AutoPostingWebhookModal extends WebhookModal {
    command = "autoposting";

    override doAfter(interaction:  ModalSubmitInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; time: number; type: AutoPostingTypes; }): Promise<void> {
        return enableAutoposting(interaction, state.channel, webhook, state.type, state.time);
    }

    override getReason(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, state: BaseState & { type: AutoPostingTypes; }): string {
        return `Autoposting of ${Util.readableConstant(AutoPostingTypes[state.type])} (${interaction.user.tag})`;
    }
}
