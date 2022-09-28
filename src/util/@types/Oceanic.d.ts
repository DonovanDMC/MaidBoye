import "oceanic.js";
import type { InteractionContent, AutocompleteChoice } from "oceanic.js";

declare module "oceanic.js" {
    export class AutocompleteInteraction {
        reply(data: Array<AutocompleteChoice>): Promise<void>;
    }

    export class CommandInteraction {
        reply(data: InteractionContent): Promise<void>;
    }

    export class ComponentInteraction {
        reply(data: InteractionContent): Promise<void>;
    }

    export class ModalSubmitInteraction {
        reply(data: InteractionContent): Promise<void>;
    }
}
