import type { LogEvents } from "../../../db/Models/LogEvent.js";
import type { BaseState, State } from "../../../util/State.js";
import CreateWebhookComponent from "../structure/CreateWebhook.js";

export default abstract class LoggingCreateWebhookComponent extends CreateWebhookComponent {
    command = "logging";

    protected override getName() {
        return "Maid Boye Logging";
    }

    protected override withExtra(base: BaseState & { event: LogEvents; }, state: State) {
        return state.with("event", base.event);
    }
}
