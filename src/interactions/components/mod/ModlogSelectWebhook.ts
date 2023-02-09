import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { enableModlog } from "../../applicationCommands/mod/modlog.js";
import SelectWebhookComponent from "../structure/SelectWebhook.js";
import type { Webhook } from "oceanic.js";

export default class ModlogSelectWebhookComponent extends SelectWebhookComponent {
    command = "modlog";

    override async doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; }) {
        return enableModlog(interaction, state.channel, webhook);
    }
}
