import { ApplicationCommandOptionTypes, ApplicationCommandTypes, type CreateApplicationCommandOptions } from "oceanic.js";
import { readFile } from "node:fs/promises";

const json = JSON.parse(await readFile(new URL("../data/bot/commands.json", import.meta.url), "utf8")) as Array<CreateApplicationCommandOptions>;
let total = 0;
const per: Record<string, number> = {};
for (const cmd of json) {
    let len = cmd.name.length;
    if (cmd.type === ApplicationCommandTypes.CHAT_INPUT) {
        len += cmd.description.length;
        for (const opt of cmd.options ?? []) {
            len += opt.name.length;
            len += opt.description.length;
            if (opt.type === ApplicationCommandOptionTypes.SUB_COMMAND_GROUP) {
                for (const sub of opt.options ?? []) {
                    len += sub.name.length;
                    len += sub.description.length;
                    if (sub.type === ApplicationCommandOptionTypes.SUB_COMMAND) {
                        for (const sub2 of sub.options ?? []) {
                            len += sub2.name.length;
                            len += sub2.description.length;
                        }
                    }
                }
            } else if (opt.type === ApplicationCommandOptionTypes.SUB_COMMAND) {
                for (const sub of opt.options ?? []) {
                    len += sub.name.length;
                    len += sub.description.length;
                }
            }
        }
    }
    total += len;
    per[cmd.name] = len;
}
console.log(total, per, json.length);
