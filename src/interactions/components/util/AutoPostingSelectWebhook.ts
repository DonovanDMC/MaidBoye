import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { enableAutoposting } from "../../applicationCommands/util/autoposting.js";
import type { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import SelectWebhookComponent from "../structure/SelectWebhook.js";
import type { Webhook } from "oceanic.js";

export default class AutoPostingSelectWebhookComponent extends SelectWebhookComponent {
    command = "autoposting";

    override async doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; time: number; type: AutoPostingTypes; }) {
        return enableAutoposting(interaction, state.channel, webhook, state.type, state.time);
    }
}
