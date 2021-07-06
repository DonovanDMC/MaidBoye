import Command from "./Command";
import CommandHandler from "./CommandHandler";
import path from "path";

export type CategoryRestrictions = "beta" | "developer" | "disabled";
export default class Category {
	name: string;
	displayName: {
		text: string;
		emojiCustom: string | null;
		emojiDefault: string | null;
	};
	description: string | null = null;
	restrictions = [] as Array<CategoryRestrictions>;
	commands = [] as Array<Command>;
	dir: string;
	file: string;
	constructor(name: string, file: string) {
		this.name = name;
		this.dir = path.dirname(file);
		this.file = file;
		this.setDisplayName(name, null, null);
	}

	setName(data: string) { this.name = data; return this; }
	setDisplayName(text: string, emojiDefault: string | null = null, emojiCustom: string | null = null) { this.displayName = { text, emojiCustom, emojiDefault }; return this; }
	setDescription(data: string) { this.description = data; return this; }

	setRestrictions(...data: Category["restrictions"]) {
		this.restrictions = data;
		return this;
	}

	register() { return CommandHandler.registerCategory(this); }
}
