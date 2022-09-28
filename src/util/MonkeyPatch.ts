import {
    AutocompleteChoice,
    AutocompleteInteraction,
    CommandInteraction,
    ComponentInteraction,
    InteractionContent,
    ModalSubmitInteraction
} from "oceanic.js";

Object.defineProperty(AutocompleteInteraction.prototype, "reply", {
    async value(this: AutocompleteInteraction, data: Array<AutocompleteChoice>) {
        await this.result(data);
    }
});

Object.defineProperty(CommandInteraction.prototype, "reply", {
    async value(this: CommandInteraction, data: InteractionContent) {
        if (this.acknowledged) await this.createFollowup(data);
        else await this.createMessage(data);
    }
});

Object.defineProperty(ComponentInteraction.prototype, "reply", {
    async value(this: ComponentInteraction, data: InteractionContent) {
        if (this.acknowledged) await this.createFollowup(data);
        else await this.createMessage(data);
    }
});

Object.defineProperty(ModalSubmitInteraction.prototype, "reply", {
    async value(this: ModalSubmitInteraction, data: InteractionContent) {
        if (this.acknowledged) await this.createFollowup(data);
        else await this.createMessage(data);
    }
});
