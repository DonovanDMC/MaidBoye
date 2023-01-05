import type MaidBoye from "../../main.js";
import { Colors } from "../Constants.js";
import Logger from "../Logger.js";
import Util from "../Util.js";
import type AutoPostingEntry from "../../db/Models/AutoPostingEntry.js";
import { AutoPostingTypes } from "../../db/Models/AutoPostingEntry.js";
import { isMainThread } from "node:worker_threads";

export default class AutoPostingWebhookFailureHandler {
    static WINDOW_TIME = 8.64e+7; // failure window is 24 hours
    static WINDOW_TOTAL = 3; // 5 failures in 24 hours will trigger deletion
    static client: MaidBoye;
    static list: Array<[time: number, amount: number, id: string]> = [];

    static async init(client: MaidBoye) {
        this.client = client;
        Logger.getLogger("AutoPostingWebhookFailureHandler").info("Initialized");
    }

    static async tick(entry: AutoPostingEntry, bypassRequirements = false) {
        if (!isMainThread) {
            throw new Error("Attempted to call AutoPostingWebhookFailureHandler#tick from a worker thread");
        }
        const dt = Date.now();
        Logger.getLogger("AutoPostingWebhookFailureHandler").warn(`Failure for autoposting "${Util.readableConstant(AutoPostingTypes[entry.type])}" (webhook: ${entry.webhook.id}, channel: ${entry.channelID}, guild: ${entry.guildID})`);
        if (!this.client) {
            throw new Error("AutoPostingWebhookFailureHandler not initialized");
        }
        this.list = this.list.filter(([t]) => t > dt);
        let [time = (dt + this.WINDOW_TIME), amount = null] = this.list.find(([, , d]) => entry.id === d) ?? [];
        if (bypassRequirements) {
            amount = this.WINDOW_TOTAL;
        }
        if (amount === null) {
            this.list.push([time, 1, entry.id]);
            return 1;
        } else {
            amount++;
            if (amount >= this.WINDOW_TOTAL) {
                const hook = await this.client.rest.webhooks.get(entry.webhook.id, entry.webhook.token).catch(() => null);
                // do nothing if the webhook still exists
                if (hook !== null) {
                    this.list.splice(this.list.findIndex(([, a, b]) => a === amount && b === entry.id), 1);
                    this.list.push([time, amount, entry.id]);
                    return this.WINDOW_TOTAL;
                }
                const ch = await this.client.getGuildChannel(entry.channelID);
                // assume channel deleted if null
                if (ch !== null && ("createMessage" in ch)) {
                    void ch.createMessage({
                        embeds: [
                            Util.makeEmbed()
                                .setTitle("Auto Posting Disabled")
                                .setDescription(`Autoposting of "${Util.readableConstant(AutoPostingTypes[entry.type])}" was disabled due to repeated failures.`)
                                .setColor(Colors.red)
                                .toJSON()
                        ]
                    });
                }
                void entry.delete();
                return 0;
            } else {
                this.list.splice(this.list.findIndex(([, a, b]) => a === amount && b === entry.id), 1);
                this.list.push([dt + this.WINDOW_TIME, amount, entry.id]);
                return amount + 1;
            }
        }
    }
}
