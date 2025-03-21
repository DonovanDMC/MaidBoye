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
import ServicesManager from "../util/ServicesManager.js";
import AutoPostingService from "../services/AutoPosting.js";
import FurryBotStatusService from "../services/FurryBotStatus.js";
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
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import type { AnyTextableGuildChannel, MessageActionRow , Message } from "oceanic.js";
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
    UserConfig,
    ServicesManager,
    AutoPostingService,
    FurryBotStatusService
};

export default new ClientEvent("messageCreate", async function messageCreateEvent(msg) {
    if (msg.author.bot) {
        return;
    }
    if (msg.channel && "guildID" in msg.channel && msg.channel.guildID !== null) {
        await Leveling.run(msg as Message<AnyTextableGuildChannel>);
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
                    let arg = args.join(" ");
                    function flag(text: string) {
                        const r = new RegExp(`(?<!\\S)-${text}(?!\\S)`, "g");
                        if (r.test(arg)) {
                            arg = arg.replace(r, "");
                            return true;
                        }

                        return false;
                    }

                    const deleteMessage = flag("d"), silent = flag("s"), raw = flag("r");

                    if (deleteMessage) {
                        await msg.delete().catch(() => null);
                    }

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

                    if (silent) {
                        Logger.getLogger("Eval").info("Silent Eval Return (formatted):", f);
                        Logger.getLogger("Eval").info("Silent Eval Return (raw):", res);
                        Logger.getLogger("Eval").info("Silent Eval Time:", t);
                    } else {
                        let file: string | undefined, out = String(raw ? res : f);
                        if (out.length >= 750) {
                            try {
                                file = inspect(JSON.parse(out), { depth: 1, colors: false, showHidden: false });
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
                const sauce = await Sauce(msg.content, 60, true, true);
                if (sauce !== null) {
                    const sources = Array.isArray(sauce.sourceOverride) ? sauce.sourceOverride : (sauce.sourceOverride === undefined ? [] : [sauce.sourceOverride]);
                    if (sauce.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                        sources.unshift(`https://e621.net/posts/${sauce.post.id}`);
                    }
                    if (sauce.ffpost !== null && !sources.some(s => s.startsWith("https://femboy.fan/posts/"))) {
                        sources.unshift(`https://femboy.fan/posts/${sauce.ffpost.id}`);
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
                        },
                        flags: Oceanic.MessageFlags.SUPPRESS_EMBEDS
                    });
                }
            } else if (msg.attachments.size !== 0) {
                for (const attachment of msg.attachments.values()) {
                    let match: RegExpExecArray | null;
                    if ((match = /^(?<md5>[\da-f]{32})\.(?:a?png|jpe?g|webp|webm|gif)$/.exec(attachment.filename))) {
                        const sauce = await directMD5(match.groups!.md5);
                        if (sauce !== null) {
                            const sources = Array.isArray(sauce.sourceOverride) ? sauce.sourceOverride : (sauce.sourceOverride === undefined ? [] : [sauce.sourceOverride]);
                            if (sauce.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                                sources.unshift(`https://e621.net/posts/${sauce.post.id}`);
                            }
                            if (sauce.ffpost !== null && !sources.some(s => s.startsWith("https://femboy.fan/posts/"))) {
                                sources.unshift(`https://femboy.fan/posts/${sauce.ffpost.id}`);
                            }
                            if (sources.length !== 0) {
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
                                    },
                                    flags: Oceanic.MessageFlags.SUPPRESS_EMBEDS
                                });
                            }
                            continue;
                        }
                    }

                    if (!/\.(?:a?png|jpe?g|webp|webm|gif)$/.test(attachment.filename)) {
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
                    const sauce = await directMD5(md5);
                    if (sauce !== null) {
                        const sources = Array.isArray(sauce.sourceOverride) ? sauce.sourceOverride : (sauce.sourceOverride === undefined ? [] : [sauce.sourceOverride]);
                        if (sauce.post !== null && !sources.some(s => s.startsWith("https://e621.net/posts/"))) {
                            sources.unshift(`https://e621.net/posts/${sauce.post.id}`);
                        }
                        if (sauce.ffpost !== null && !sources.some(s => s.startsWith("https://femboy.fan/posts/"))) {
                            sources.unshift(`https://femboy.fan/posts/${sauce.ffpost.id}`);
                        }
                        if (sources.length !== 0) {
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
                                },
                                flags: Oceanic.MessageFlags.SUPPRESS_EMBEDS
                            });
                        }
                    }
                }
            }
        }
    }
});
