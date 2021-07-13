import { Colors } from "./Constants";
import config from "@config";
import { User, EmbedField, EmbedOptions } from "eris";

export default class EmbedBuilder {
	private json: EmbedOptions;
	constructor(defaults = true, user?: User | null) {
		this.json = {};
		if (defaults) {
			this.setColor("bot").setTimestamp("now").setFooter("UwU", config.images.bot);
			if (user) this.setAuthor(user.tag, user.avatarURL);
		}
	}

	static new(defaults = true, user?: User) { return new EmbedBuilder(defaults, user); }

	setAuthor(name: string, icon_url?: string, url?: string) {
		this.json.author = {
			name,
			icon_url,
			url
		};

		return  this;
	}
	getAuthor() { return this.json.author; }

	setColor(color: number | keyof typeof Colors) {
		if (typeof color === "string") color = Colors[color];
		this.json.color = color;
		return this;
	}
	getColor() { return this.json.color; }

	setDescription(first: string | Array<string>, ...other: Array<(string | Array<string>)>) { this.json.description = [...(Array.isArray(first) ? first : [first]), ...(other.map(o => [...(Array.isArray(o) ? o : [o])].join("\n")))].join("\n"); return this; }
	getDescription() { return this.json.description; }

	addField(name: string, value: string, inline?: boolean) { this.json.fields = [...(this.json.fields ?? []), { name, value, inline }]; return this; }
	addBlankField(inline?: boolean) { return this.addField("\u200b", "\u200b", inline); }
	getField(index: number) { return (this.json.fields ?? [])[index]; }
	addFields(...args: Array<EmbedField>) { args.forEach(arg => this.addField(arg.name, arg.value, arg.inline)); return this; }
	getFields() { return (this.json.fields ?? []); }

	setFooter(text: string, icon_url = config.images.bot) { this.json.footer = { text, icon_url }; return this; }
	getFooter() { return this.json.footer; }

	setImage(url: string) { this.json.image = { url }; return this; }
	getImage() { return this.json.image; }

	setThumbnail(url: string) { this.json.thumbnail = { url }; return this; }
	getThumbnail() { return this.json.thumbnail; }

	setTimestamp(time: string | Date | "now") {
		if (time === "now") time = new Date().toISOString();
		this.json.timestamp = time;
		return this;
	}
	getTimestamp() { return this.json.timestamp; }

	setTitle(title: string) { this.json.title = title; return this; }
	getTitle() { return this.json.title; }

	setURL(url: string) { this.json.url = url; return this; }
	getURL() { return this.json.url; }

	toJSON(array: true): Array<EmbedOptions>;
	toJSON(array?: false): EmbedOptions;
	toJSON(array = false) { return array ? [this.json] : this.json; }
}
