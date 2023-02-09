import type { BaseState, State } from "../../../util/State.js";
import type { AutoPostingTypes } from "../../../db/Models/AutoPostingEntry.js";
import CreateWebhookComponent from "../structure/CreateWebhook.js";

export default class AutoPostingCreateWebhookComponent extends CreateWebhookComponent {
    command = "autoposting";

    protected override getName() {
        return "Maid Boye Auto Posting";
    }

    protected override withExtra(base: BaseState & { time: number; type: AutoPostingTypes; }, state: State) {
        return state.with("time", base.time).with("type", base.type);
    }
}
