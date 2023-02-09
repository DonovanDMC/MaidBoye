import type { LogEvents } from "../../../db/Models/LogEvent.js";
import type { SelectMenuComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import { enableLogging } from "../../applicationCommands/util/logging.js";
import SelectWebhookComponent from "../structure/SelectWebhook.js";
import type { Webhook } from "oceanic.js";

export default class LoggingSelectWebhookComponent extends SelectWebhookComponent {
    command = "logging";


    override async doAfter(interaction: SelectMenuComponentInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState & { channel: string; event: LogEvents; }) {
        return enableLogging(interaction, state.channel, webhook, state.event);
    }
}
