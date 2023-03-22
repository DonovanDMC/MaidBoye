import Config from "../config/index.js";
import ClientEvent from "../util/ClientEvent.js";
import db from "../db/index.js";
import Util from "../util/Util.js";
import RequestProxy from "../util/RequestProxy.js";
import { Colors } from "../util/Constants.js";
import { State } from "../util/State.js";
import Leveling from "../util/Leveling.js";
import GuildConfig from "../db/Models/GuildConfig.js";
import UserConfig from "../db/Models/UserConfig.js";
import Sauce, { directMD5 } from "../util/Sauce.js";
import Logger from "@uwu-codes/logger";
import {
    Internal,
    Strings,
    Time,
    Timer,
    Utility,
    ReNice
} from "@uwu-codes/utils";
import * as Oceanic from "oceanic.js";
import { parse, strip } from "dashargs";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { AnyGuildTextChannel, MessageActionRow , Message } from "oceanic.js";
import { inspect } from "node:util";
import { createHash } from "node:crypto";

async function format(obj: unknown) {
    if (obj instanceof Promise) {
        obj = await obj;
    }
    if (Array.isArray(obj)) {
        return JSON.stringify(obj, (k, v: unknown) => typeof v === "bigint" ? `${v.toString()}n` : v);
    }
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
    Utility,
    ReNice,
    RequestProxy,
    Config,
    GuildConfig,
    UserConfig
};

export default new ClientEvent("messageCreate", async function messageCreateEvent(msg) {
    if (msg.author.bot) {
        return;
    }
    if (msg.channel && "guildID" in msg.channel && msg.channel.guildID !== null) {
        await Leveling.run(msg as Message<AnyGuildTextChannel>);
    }
    if (Config.developers.includes(msg.author.id)) {
        const [prefix, command, ...args] = msg.content.split(" ");

        if (new RegExp(`^<@!?${this.user.id}>`).test(prefix)) {
            switch (command) {
                case "eval": {
                    Object.defineProperties(msg, {
                        gConfig: {
                            value: msg.guildID === null ? null : await GuildConfig.get(msg.guildID)
                        },
                        uConfig: {
                            value: await UserConfig.get(msg.author.id)
                        }
                    });
                    // eslint-disable-next-line guard-for-in
                    for (const k in evalVariables) {
                        // eslint-disable-next-line guard-for-in, @typescript-eslint/no-implied-eval, no-new-func -- typescript messes with variable names so we have to remake them
                        new Function("value", `${k} = value`)(evalVariables[k]);
                    }
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

                    if (flags.has("delete") || flags.has("d")) {
                        await msg.delete().catch(() => null);
                    }
                    if (flags.has("silent") || flags.has("s")) {
                        Logger.getLogger("Eval").info("Silent Eval Return (formatted):", f);
                        Logger.getLogger("Eval").info("Silent Eval Return (raw):", res);
                        Logger.getLogger("Eval").info("Silent Eval Time:", t);
                    } else {
                        let file: string | undefined, out = String(flags.has("raw") || flags.has("r") ? res : f);
                        if (out.length >= 750) {
                            try {
                                file = inspect(JSON.parse(out), { depth: 1 });
                            } catch {
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
                    }
                    return;
                }
            }
        }
    }

    if (new RegExp(`^<@!?${this.user.id}> `).test(msg.content)) {
        const [,...args] = msg.content.split(" ");
        const content = args.join(" ").toLowerCase();
        if (content.startsWith("make me")) {
            return this.rest.channels.createMessage(msg.channelID, { content: "Th-that's not my purpose.." });
        }
        if (content.startsWith("fuck me")) {
            return this.rest.channels.createMessage(msg.channelID, { content: "I-I don't even know you.." });
        }
        if (content.startsWith("bend over")) {
            return this.rest.channels.createMessage(msg.channelID, { content: "N-no ~w~" });
        }
    }

    if (msg.guildID !== null) {
        const gConfig = await GuildConfig.get(msg.guildID);
        if (gConfig.settings.autoSourcing) {
            if (Strings.validateURL(msg.content)) {
                const sauce = await Sauce(msg.content, 0, true, true);
                if (sauce !== null) {
                    const sources = Array.isArray(sauce.sourceOverride) ? sauce.sourceOverride : (sauce.sourceOverride === undefined ? [] : [sauce.sourceOverride]);
                    if (sauce.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                        sources.unshift(`https://e621.net/posts/${sauce.post.id}`);
                    }
                    await this.rest.channels.createMessage(msg.channelID, {
                        content:          sources.join("\n"),
                        messageReference: {
                            channelID:       msg.channelID,
                            guildID:         msg.guildID,
                            messageID:       msg.id,
                            failIfNotExists: false
                        },
                        allowedMentions: {
                            users:       false,
                            roles:       false,
                            everyone:    false,
                            repliedUser: false
                        }
                    });
                }
            } else if (msg.attachments.size !== 0) {
                for (const attachment of msg.attachments.values()) {
                    console.log(attachment.filename);
                    let match: RegExpExecArray | null;
                    if ((match = /^(?<md5>[\da-f]{32})\.(?:png|jpe?g|webp|webm|gif|apng)$/.exec(attachment.filename))) {
                        const sauce = await directMD5(match.groups!.md5);
                        if (sauce !== null) {
                            const sources = Array.isArray(sauce.sourceOverride) ? sauce.sourceOverride : (sauce.sourceOverride === undefined ? [] : [sauce.sourceOverride]);
                            if (sauce.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                                sources.unshift(`https://e621.net/posts/${sauce.post.id}`);
                            }
                            await this.rest.channels.createMessage(msg.channelID, {
                                content:          sources.join("\n"),
                                messageReference: {
                                    channelID:       msg.channelID,
                                    guildID:         msg.guildID,
                                    messageID:       msg.id,
                                    failIfNotExists: false
                                },
                                allowedMentions: {
                                    users:       false,
                                    roles:       false,
                                    everyone:    false,
                                    repliedUser: false
                                }
                            });
                            continue;
                        }
                    }

                    if (!/\.(?:png|jpe?g|webp|webm|gif|apng)$/.test(attachment.filename)) {
                        return;
                    }

                    if (attachment.size > 1024 * 1024 * 10) {
                        continue;
                    }


                    const file = await fetch(attachment.url, {
                        method:  "GET",
                        headers: {
                            "User-Agent": Config.userAgent
                        }
                    });
                    const md5 = createHash("md5").update(Buffer.from(await file.arrayBuffer())).digest("hex");
                    const att = await directMD5(md5);
                    if (att !== null) {
                        const sources = Array.isArray(att.sourceOverride) ? att.sourceOverride : (att.sourceOverride === undefined ? [] : [att.sourceOverride]);
                        if (att.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                            sources.unshift(`https://e621.net/posts/${att.post.id}`);
                        }
                        await this.rest.channels.createMessage(msg.channelID, {
                            content:          sources.join("\n"),
                            messageReference: {
                                channelID:       msg.channelID,
                                guildID:         msg.guildID,
                                messageID:       msg.id,
                                failIfNotExists: false
                            },
                            allowedMentions: {
                                users:       false,
                                roles:       false,
                                everyone:    false,
                                repliedUser: false
                            }
                        });
                    }
                }
            }
        }
    }
});
