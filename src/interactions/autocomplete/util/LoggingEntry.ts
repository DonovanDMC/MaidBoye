import type { AnyAutocompleteFocus } from "../index.js";
import type { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import BaseAutocomplete from "../structure/BaseAutocomplete.js";
import LogEvent, { LogEvents } from "../../../db/Models/LogEvent.js";
import Util from "../../../util/Util.js";
import type { AnyGuildTextChannelWithoutThreads } from "oceanic.js";
import FuzzySearch from "fuzzy-search";
import assert from "node:assert";

export default class LoggingEntryAutocomplete extends BaseAutocomplete {
    command = "logging";
    option = "entry";

    override async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        assert(typeof focused.value === "string");
        const events = await LogEvent.getAll(interaction.guild.id);
        const choices = events.map(ev => ({ name: `${Util.readableConstant(LogEvents[ev.event])} in #${interaction.client.getChannel<AnyGuildTextChannelWithoutThreads>(ev.channelID)?.name ?? ev.channelID}`, value: ev.id }));
        const fuzzy = new FuzzySearch(choices, ["name"], { caseSensitive: false });
        return interaction.reply(fuzzy.search(focused.value).slice(0, 25));
    }
}
