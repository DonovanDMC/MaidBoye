
import { AutocompleteInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import NotImplementedError from "../../../util/NotImplementedError.js";
import type { AnyAutocompleteFocus } from "../index.js";

export default abstract class BaseAutocomplete {
    // we don't really need the id right now, but we're keeping a note of it incase we need it later
    id: number;
    validLocation = ValidLocation.BOTH;
    abstract command: string;
    abstract option: string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async handle(interaction: AutocompleteInteraction, focused: AnyAutocompleteFocus) {
        throw new NotImplementedError(`${this.constructor.name}#handle called but not defined in extending class`);
    }

    async handleDM(interaction: AutocompleteInteraction<ValidLocation.PIVATE>, focused: AnyAutocompleteFocus) {
        return this.handle(interaction, focused);
    }

    async handleGuild(interaction: AutocompleteInteraction<ValidLocation.GUILD>, focused: AnyAutocompleteFocus) {
        return this.handle(interaction, focused);
    }
}
