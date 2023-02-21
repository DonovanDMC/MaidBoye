import WebhookHandler from "./WebhookHandler.js";
import Config from "../../config/index.js";
import type MaidBoye from "../../main.js";
import Util from "../Util.js";
import { Colors } from "../Constants.js";
import Logger from "../Logger.js";
import { Strings } from "@uwu-codes/utils";

export default class ExceptionHandler {
    static client: MaidBoye;
    static async createPaste(content: string, name: string, expire: "N" | "10M" | "1H" | "1D" | "1W" | "2W" | "1M" | "6M" | "1Y" = "1W", privacy: 0 | 1 | 2 = 2) {
        if (name.length > 100) {
            name = Strings.truncate(name, 100);
        }
        const form = new FormData();
        form.set("api_option", "paste");
        form.set("api_dev_key", Config.pastebinDevKey);
        form.set("api_user_key", Config.pastebinUserKey);
        form.set("api_paste_code", content);
        form.set("api_paste_name", name);
        form.set("api_paste_expire_date", expire);
        form.set("api_paste_private", privacy.toString());
        const res = await fetch("https://pastebin.com/api/api_post.php", {
            method: "POST",
            body:   form
        });
        if (res.status === 200) {
            return (await res.text()).replace("https://pastebin.com/", "");
        } else {
            const err = await res.text();
            Logger.getLogger("Error Handler").error(`Pastebin API returned status code ${res.status} (${err})`);
            await WebhookHandler.execute("error", {
                embeds: Util.makeEmbed(true)
                    .setTitle("Failed To Create Paste For Error")
                    .setDescription([
                        err,
                        "",
                        `Name: \`${name}\``,
                        `Expire: \`${expire}\``,
                        `Privacy: \`${privacy?.toString()}\``,
                        `Content Length: \`${content.length}\``
                    ])
                    .setColor(Colors.red)
                    .toJSON(true)
            });
            return "null";
        }
    }

    static async handle(error: Error, type: "autocomplete" | "command" | "component" | "modal" | "unhandledRejection" | "uncaughtException", context: string) {
        const paste = Config.isDevelopment ? "console" : await this.createPaste(error.stack ?? error.message, error.message);
        const code = `err.${Config.isDevelopment ? "dev." : ""}${paste}`;
        Logger.getLogger(`Error Handler | ${code} | Error`).error(error);
        Logger.getLogger(`Error Handler | ${code} | Context`).error(context);
        /*  if (Config.isDevelopment) {
            return code;
        } */
        await WebhookHandler.execute("error", {
            embeds: Util.makeEmbed(true)
                .setTitle(error.message)
                .setDescription(Strings.truncate([
                    `Source: **${Util.readableConstant(type.replace(/([A-Z])/g, "_$1"))}**`,
                    "",
                    `Code: \`${code}\``,
                    `Paste: ${Config.isDevelopment ? "**None**" : `https://pastebin.com/${paste}`}`,
                    context
                ].join("\n"), 2000))
                .setColor(Colors.red)
                .toJSON(true)
        });

        return code;
    }

    static async init(client: MaidBoye) {
        this.client = client;
    }
}
