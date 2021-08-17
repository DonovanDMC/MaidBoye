import * as fs from "fs-extra";
import config from "../config";

interface Setting {
	nsfw: boolean;
}

export const DEFAULT = {
	nsfw: false
} as Setting;

const file = `${config.dir.data}/config.json`;
export function GetSettings(id: number): Setting;
export function GetSettings(id: null): Record<number, Setting>;
export function GetSettings(id: number | null) {
	fs.mkdirpSync(config.dir.data);
	if(!fs.existsSync(file)) fs.writeFileSync(file, "{}");
	const set = JSON.parse(fs.readFileSync(file, { encoding: "utf-8" })) as Record<number, Setting>;
	if(id === null) return set;
	return (set[id] ?? DEFAULT);
}

export function EditSettings<K extends keyof Setting>(id: number, name: K, value: Setting[K]) {
	const set = GetSettings(null);
	set[id] = {
		...DEFAULT,
		...(set[id] ?? {}),
		[name]: value
	};
	fs.writeFileSync(file, JSON.stringify(set));

	return set[id];
}
