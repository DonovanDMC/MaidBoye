import WebhookHandler from "./WebhookHandler.js";
import Config from "../../config/index.js";
import type MaidBoye from "../../main.js";
import Util from "../Util.js";
import { Colors } from "../Constants.js";
import Logger from "../Logger.js";
import { randomBytes } from "node:crypto";

export default class ExceptionHandler {
    static client: MaidBoye;
    static async createPaste(content: string, name: string, expire?: "N" | "10M" | "1H" | "1D" | "1W" | "2W" | "1M" | "6M" | "1Y", privacy?: 0 | 1 | 2) {
        const form = new FormData();
        form.set("api_option", "paste");
        form.set("api_dev_key", Config.pastebinDevKey);
        form.set("api_user_key", Config.pastebinUserKey);
        form.set("api_paste_code", content);
        form.set("api_paste_name", name);
        form.set("api_paste_expire_date", expire ?? "7D");
        form.set("api_paste_private", privacy?.toString() ?? "2");
        const code = await fetch("https://pastebin.com/api/api_post.php", {
            method: "POST",
            body:   form
        }).then(r => r.text());
        return code;
    }

    static async handle(error: Error, type: "autocomplete" | "command" | "component" | "modal" | "unhandledRejection" | "uncaughtException", context: string) {
        const paste = Config.isDevelopment ? `dev${randomBytes(3).toString("hex")}` : await this.createPaste(error.stack ?? error.message, error.message);
        const code = `err.${Config.isDevelopment ? "dev." : ""}${paste}`;
        Logger.getLogger(`Error Handler | ${code} | Error`).error(error);
        Logger.getLogger(`Error Handler | ${code} | Context`).error(context);
        if (Config.isDevelopment) {
            return paste;
        }
        await WebhookHandler.execute("error", {
            embeds: Util.makeEmbed(true)
                .setTitle(error.message)
                .setDescription([
                    `Source: **${Util.readableConstant(type.replace(/([A-Z])/g, "_$1"))}**`,
                    "",
                    `Code: \`${code}\``,
                    `Paste: https://pastebin.com/${paste}`,
                    context
                ])
                .setColor(Colors.red)
                .toJSON(true)
        });

        return code;
    }

    static async init(client: MaidBoye) {
        this.client = client;
    }
}
