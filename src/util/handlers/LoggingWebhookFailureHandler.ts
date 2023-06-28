import type LogEvent from "../../db/Models/LogEvent.js";
import { LogEvents } from "../../db/Models/LogEvent.js";
import type MaidBoye from "../../main.js";
import { Colors } from "../Constants.js";
import Util from "../Util.js";
import Logger from "@uwu-codes/logger";
import { Strings } from "@uwu-codes/utils";

export default class LoggingWebhookFailureHandler {
    static WINDOW_TIME = 2.16e+7; // failure window is 6 hours
    static WINDOW_TOTAL = 5; // 5 failures in 6 hours will trigger deletion
    static client: MaidBoye;
    static list: Array<[time: number, amount: number, id: string]> = [];

    static async init(client: MaidBoye) {
        this.client = client;
        Logger.getLogger("LoggingWebhookFailureHandler").info("Initialized");
    }

    static async tick(log: LogEvent, bypassRequirements = false) {
        const dt = Date.now();
        if (!this.client) {
            return -1 as const;
        }
        this.list = this.list.filter(([t]) => t > dt);
        Logger.getLogger("LoggingWebhookFailureHandler").warn(`Failure for event "${LogEvents[log.event]}" (webhook: ${log.webhook.id}, channel: ${log.channelID}, guild: ${log.guildID})`);
        // eslint-disable-next-line prefer-const
        let [time = (dt + this.WINDOW_TIME), amount = null] = this.list.find(([, , d]) => log.id === d) ?? [];
        if (bypassRequirements) {
            amount = this.WINDOW_TOTAL;
        }
        if (amount === null) {
            this.list.push([time, 1, log.id]);
            return 1;
        } else {
            amount++;
            if (amount >= this.WINDOW_TOTAL) {
                const hook = await this.client.rest.webhooks.get(log.webhook.id, log.webhook.token).catch(() => null);
                // do nothing if the webhook still exists
                if (hook !== null) {
                    this.list.splice(this.list.findIndex(([, a, b]) => a === amount && b === log.id), 1);
                    this.list.push([time, amount, log.id]);
                    return this.WINDOW_TOTAL;
                }
                const ch = await this.client.getGuildChannel(log.channelID);
                // assume channel deleted if null
                if (ch !== null && ("createMessage" in ch)) {
                    void ch.createMessage({
                        embeds: [
                            Util.makeEmbed()
                                .setTitle("Logging Disabled")
                                .setDescription(`Logging of the event "${Strings.ucwords(LogEvents[log.event].toLowerCase().replaceAll("_", " "))}" was disabled due to repeated failures.`)
                                .setColor(Colors.red)
                                .toJSON()
                        ]
                    });
                }
                void log.delete();
                return 0;
            } else {
                this.list.splice(this.list.findIndex(([, a, b]) => a === amount && b === log.id), 1);
                this.list.push([dt + this.WINDOW_TIME, amount, log.id]);
                return amount + 1;
            }
        }
    }
}
