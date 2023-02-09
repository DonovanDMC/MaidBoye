import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { enableWelcome } from "../../applicationCommands/util/welcome.js";
import SelectWebhookComponent from "../structure/SelectWebhook.js";
import type { Webhook } from "oceanic.js";

export default class WelcomeSelectWebhookComponent extends SelectWebhookComponent {
    command = "welcome";

    override async doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; }) {
        return enableWelcome(interaction, state.channel, webhook);
    }
}
