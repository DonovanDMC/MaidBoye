import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import { LogCategories, LogEvents } from "../../../db/Models/LogEvent.js";
import Util from "../../../util/Util.js";
import { assert } from "tsafe";

export default class LoggingEventAutocomplete extends BaseAutocomplete {
    command = "logging";
    option = "event";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const category = interaction.data.options.getString<keyof typeof LogCategories>("category");
        if (!category) return interaction.result([
            { name: "Select a category first.", value: "ALL" }
        ]);
        return interaction.result(LogCategories[category].map(event => ({ name: Util.readableConstant(LogEvents[event]), value: LogEvents[event] })));
    }
}
