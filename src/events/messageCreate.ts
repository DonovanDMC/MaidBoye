import Config from "../config/index.js";
import ClientEvent from "../util/ClientEvent.js";
import db from "../db/index.js";
import Util from "../util/Util.js";
import RequestProxy from "../util/RequestProxy.js";
import { Colors } from "../util/Constants.js";
import { State } from "../util/State.js";
import Logger from "../util/Logger.js";
import {
    Internal,
    Strings,
    Time,
    Timer,
    Timers,
    Utility,
    ReNice
} from "@uwu-codes/utils";
import * as Oceanic from "oceanic.js";
import { parse, strip } from "dashargs";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { MessageActionRow } from "oceanic.js";
import { inspect } from "util";

async function format(obj: unknown) {
    if (obj instanceof Promise) obj = await obj;
    if (Array.isArray(obj)) return JSON.stringify(obj, (k, v: unknown) => typeof v === "bigint" ? `${v.toString()}n` : v);
    return inspect(obj, { depth: 1, colors: false, showHidden: false });
}

const evalVariables: Record<string, unknown> = {
    Oceanic,
    db,
    Util,
    Redis: db.redis,
    Internal,
    Strings,
    Time,
    Timer,
    Timers,
    Utility,
    ReNice,
    RequestProxy,
    Config
};

export default new ClientEvent("messageCreate", async function messageCreateEvent(msg) {
    if (Config.developers.includes(msg.author.id)) {
        const [prefix, command, ...args] = msg.content.split(" ");

        if (new RegExp(`^<@!?${this.user.id}>`).test(prefix)) {
            switch (command) {
                case "eval": {
                // eslint-disable-next-line guard-for-in, @typescript-eslint/no-implied-eval, no-new-func -- typescript messes with variable names so we have to remake them
                    for (const k in evalVariables) new Function("value", `${k} = value`)(evalVariables[k]);
                    let res: unknown;
                    const flags = parse(args.join(" "), {
                        parseArgs: false
                    });
                    const arg = strip(args.join(" "), {
                        removeFlags: true
                    });
                    const start = Timer.getTime();
                    try {
                    // eslint-disable-next-line no-eval
                        res = await eval(`(async()=>{${arg.includes("return") ? "" : "return "}${arg}})()`);
                    } catch (err) {
                        res = err;
                    }
                    const end = Timer.getTime();

                    const f = await format(res);
                    const t = Timer.calc(start, end, 3, false);

                    if (flags.has("delete") || flags.has("d")) await msg.delete().catch(() => null);
                    if (!(flags.has("silent") || flags.has("s"))) {
                        let file: string | undefined, out = String(flags.has("raw") || flags.has("r") ? res : f);
                        if (out.length >= 750) {
                            try {
                                file = inspect(JSON.parse(out), { depth: 1 });
                            } catch (e) {
                                file = out;
                            }
                            out = "see attached file";
                        }


                        await this.rest.channels.createMessage(msg.channelID, {
                            embeds: [
                                Util.makeEmbed(true, msg.author)
                                    .setTitle(`Time Taken: ${t}`)
                                    .setColor(res instanceof Error ? Colors.red : Colors.green)
                                    .addField(`${Config.emojis.default.in} Input`, `\`\`\`js\n${Strings.truncateWords(arg, 750)}\`\`\``, false)
                                    .addField(`${Config.emojis.default.out} Output`, `\`\`\`js\n${out}\`\`\``, false)
                                    .toJSON()
                            ],
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(msg.author.id, "eval", "trash").encode(),
                                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.trash, "default"),
                                    style:    ButtonColors.RED
                                })
                                .addInteractionButton({
                                    customID: State.new(msg.author.id, "eval", "delete").encode(),
                                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.x, "default"),
                                    style:    ButtonColors.GREEN
                                })
                                .toJSON(),
                            files: file ? [{
                                contents: Buffer.from(file),
                                name:     "output.txt"
                            }] : undefined
                        });
                    } else {
                        Logger.getLogger("Eval").info("Silent Eval Return (formatted):", f);
                        Logger.getLogger("Eval").info("Silent Eval Return (raw):", res);
                        Logger.getLogger("Eval").info("Silent Eval Time:", t);
                    }
                    break;
                }
            }
        }
    }

    if (new RegExp(`^<@!?${this.user.id}> `).test(msg.content)) {
        const [,...args] = msg.content.split(" ");
        const content = args.join(" ").toLowerCase();
        if (content.startsWith("make me")) return this.rest.channels.createMessage(msg.channelID, { content: "Th-that's not my purpose.." });
        if (content.startsWith("fuck me")) return this.rest.channels.createMessage(msg.channelID, { content: "I-I don't even know you.." });
        if (content.startsWith("bend over")) return this.rest.channels.createMessage(msg.channelID, { content: "N-no ~w~" });
    }
});
