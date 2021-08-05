import config from "@config";
import Logger from "@util/Logger";
import { Time } from "@uwu-codes/utils";
import * as fs from "fs-extra";

export default class TempFiles {
	static list = new Map<string, number>();
	static markForDeletion(loc: string, time: number) {
		if (this.list.has(loc)) {
			if (time < this.list.get(loc)!)
				Logger.getLogger("TempFiles").warn(`Deletion time for the file "${loc}" has been changed from  ${Time.formatDateWithPadding(this.list.get(loc), true, false, true, false)} to ${Time.formatDateWithPadding(time, true, false, true, false)} due to a secondary markForDeletion with a lower time.`);
			else
				return;
		}
		this.list.set(loc, time);
		fs.writeFileSync(`${config.dir.data}/temp.json`, JSON.stringify(Array.from(this.list.entries())));
	}
	static interval: NodeJS.Timeout;
	static process() {
		const d = Date.now();
		const e = this.list.entries();
		const old = JSON.stringify(e);
		for (const [loc, time] of e) {
			if (time < d) {
				if (!fs.existsSync(loc)) {
					Logger.getLogger("TempFiles").warn(`File "${loc}" marked for deletion at ${Time.formatDateWithPadding(d, true, false, true, false)} no longer exists, skipping..`);
					this.list.delete(loc);
					continue;
				}
				try {
					fs.unlinkSync(loc);
					Logger.getLogger("TempFiles").debug(`File "${loc}" marked for deletion at ${Time.formatDateWithPadding(d, true, false, true, false)} was successfully deleted.`);
					this.list.delete(loc);
					continue;
				} catch (err) {
					Logger.getLogger("TempFiles").error(`File "${loc}" marked for deletion at ${Time.formatDateWithPadding(d, true, false, true, false)} threw an error while attempting to delete:`, err);
					this.list.delete(loc);
					continue;
				}
			}
		}
		if (JSON.stringify(Array.from(e)) !== old)
			fs.writeFileSync(`${config.dir.data}/temp.json`, JSON.stringify(Array.from(e)));
	}
	static init() {
		this.interval = setInterval(TempFiles.process.bind(TempFiles), 1e3);
		if (fs.existsSync(`${config.dir.data}/temp.json`)) {
			const t = JSON.parse<Array<[string, number]>>(fs.readFileSync(`${config.dir.data}/temp.json`).toString());
			t.forEach(([k, v]) => this.list.set(k, v));
			Logger.getLogger("TempFiles").debug(`Loaded ${t.length} entries from disk`);
		}
	}
}
