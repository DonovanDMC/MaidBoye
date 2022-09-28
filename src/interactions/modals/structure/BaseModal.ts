import { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import NotImplementedError from "../../../util/NotImplementedError.js";
import type { BaseState } from "../../../util/State.js";

export default abstract class BaseModal {
    // we don't really need the id right now, but we're keeping a note of it incase we need it later
    id: number;
    validLocation = ValidLocation.BOTH;
    abstract action: string;
    abstract command: string | null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async handle(interaction: ModalSubmitInteraction, components: Record<string, string | undefined>, data: BaseState) {
        throw new NotImplementedError(`${this.constructor.name}#handle called but not defined in extending class`);
    }

    async handleDM(interaction: ModalSubmitInteraction<ValidLocation.PIVATE>, components: Record<string, string | undefined>, data: BaseState) {
        return this.handle(interaction, components, data);
    }

    async handleGuild(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, components: Record<string, string | undefined>, data: BaseState) {
        return this.handle(interaction, components, data);
    }
}
