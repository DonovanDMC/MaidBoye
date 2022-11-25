import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction } from "../../../util/cmd/Command.js";
import E621 from "../../../util/req/E621.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import { assert } from "tsafe";

export default class E621TagsAutocomplete extends BaseAutocomplete {
    command = "e621";
    option = "tags";

    protected override async handle(interaction: AutocompleteInteraction, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const tags = focused.value.split(" ");
        const currentValue = tags[tags.length - 1];
        if (!currentValue || currentValue.length < 3) {
            return interaction.reply(focused.value === "" ? [
                { name: "(NONE)", value: "" }
            ] : [
                { name: focused.value, value: focused.value }
            ]);
        } else {
            const auto = await E621.tags.getAutocomplete(currentValue);
            if (auto === null) {
                return interaction.reply([{ name: focused.value, value: focused.value }]);
            }
            const valueWithoutLast = focused.value.slice(0, focused.value.indexOf(currentValue)).trim();
            return interaction.reply([
                { name: focused.value, value: focused.value },
                ...auto.map(a => ({
                    name:  `${valueWithoutLast} ${a.name}`,
                    value: `${valueWithoutLast} ${a.name}`
                }))
            ]);
        }
    }
}
