import type Command from "./Command.js";
import type { MessageCommand, UserCommand } from "./OtherCommand.js";
import CommandHandler from "./CommandHandler.js";

export type CategoryRestrictions = "beta" | "developer" | "disabled";
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

    async register() {
        return CommandHandler.registerCategory(this);
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
