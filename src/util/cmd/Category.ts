import type Command from "./Command.js";
import type { MessageCommand, UserCommand } from "./OtherCommand.js";
import CommandHandler from "./CommandHandler.js";
import { ApplicationCommandTypes } from "oceanic.js";

export type CategoryRestrictions = "beta" | "developer" | "disabled";
export type TypeToClass<T extends ApplicationCommandTypes> = T extends ApplicationCommandTypes.MESSAGE ? MessageCommand : T extends ApplicationCommandTypes.USER ? UserCommand : Command;
export default class Category {
    commands = [] as Array<Command>;
    description: string | null = null;
    dir: string;
    displayName: {
        emojiCustom: string | null;
        emojiDefault: string | null;
        text: string;
    };
    file: string;
    generic = {
        command: [] as Array<Command>,
        message: [] as Array<MessageCommand>,
        user:    [] as Array<UserCommand>
    };
    messageCommands = [] as Array<MessageCommand>;
    name: string;
    restrictions = [] as Array<CategoryRestrictions>;
    userCommands = [] as Array<UserCommand>;
    constructor(name: string, file: string) {
        this.name = name;
        this.dir = new URL(".", file).pathname.slice(0, -1);
        this.file = file;
        this.setDisplayName(name, null, null);
    }

    addGenericCommands(expander: <T extends ApplicationCommandTypes>(type: T, file: string, name: string, description?: string) => TypeToClass<T>, map: Record<string, string | [type: ApplicationCommandTypes.CHAT_INPUT, description: string] | [type: ApplicationCommandTypes.MESSAGE | ApplicationCommandTypes.USER]>) {
        for (const [name, data] of Object.entries(map)) {
            if (Array.isArray(data)) {
                const [type, description] = data;
                const store = this.generic[type === ApplicationCommandTypes.MESSAGE ? "message" as const : (type === ApplicationCommandTypes.USER ? "user" as const : "command" as const)];
                store.push(expander(type, this.file, name, description) as never);
            } else {
                const store = this.generic.command;
                store.push(expander(ApplicationCommandTypes.CHAT_INPUT, this.file, name, data));
            }
        }

        return this;
    }

    async register() {
        return CommandHandler.registerCategory(this);
    }

    async registerGeneric() {
        for (const command of this.generic.command) {
            await CommandHandler.registerCommand(this, this.file, command);
        }
        for (const command of this.generic.user) {
            await CommandHandler.registerCommand(this, this.file, undefined, command);
        }
        for (const command of this.generic.message) {
            await CommandHandler.registerCommand(this, this.file, undefined, undefined, command);
        }
    }

    setDescription(data: string) {
        this.description = data; return this;
    }

    setDisplayName(text: string, emojiDefault: string | null = null, emojiCustom: string | null = null) {
        this.displayName = { text, emojiCustom, emojiDefault }; return this;
    }

    setName(data: string) {
        this.name = data; return this;
    }

    setRestrictions(...data: Category["restrictions"]) {
        this.restrictions = data;
        return this;
    }
}
