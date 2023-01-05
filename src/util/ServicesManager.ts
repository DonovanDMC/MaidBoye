import Logger from "./Logger.js";
import Debug from "./Debug.js";
import AutoPostingWebhookFailureHandler from "./handlers/AutoPostingWebhookFailureHandler.js";
import MaidBoye from "../main.js";
import Config from "../config/index.js";
import AutoPostingEntry from "../db/Models/AutoPostingEntry.js";
import { ChannelTypes } from "oceanic.js";
import { randomUUID } from "node:crypto";
import { Worker } from "node:worker_threads";

export enum ServiceEvents {
    READY = "ready",
    RESPONSE = "response",
    WORKER_COMMAND = "workerCommand",
    MASTER_COMMAND = "masterCommand"
}

export interface ServiceMessage {
    data: unknown;
    event: ServiceEvents;
    from?: string;
    id: string;
    responseTo?: string;
    responsive?: boolean;
}
export default class ServicesManager {
    static cb: Map<string, { reject(reason?: unknown): void; resolve(value?: unknown): void; }> = new Map();
    static exitCounts: Map<string, number> = new Map();
    static serviceStatuses: Map<string, "starting" | "ready" | "dead"> = new Map();
    static services: Map<string, Worker> = new Map();

    private static async _handleMessage(worker: Worker, message: ServiceMessage) {
        const name = this.workerToName(worker)!;
        Debug("services:master", `Received message from service "${name}":`, message);
        switch (message.event) {
            case ServiceEvents.READY: {
                Logger.getLogger("Services").info(`Service "${name}" is ready.`);
                this.serviceStatuses.set(name, "ready");
                this.exitCounts.set(name, 0);
                this.cb.get(name)?.resolve();
                this.cb.delete(name);
                break;
            }

            case ServiceEvents.RESPONSE: {
                this.cb.get(message.responseTo!)?.resolve(message);
                this.cb.delete(message.responseTo!);
                break;
            }

            case ServiceEvents.WORKER_COMMAND: {
                const { data, name: toname, op } = (message.data as { data?: unknown; name: string; op: string; });
                const res = await this.send(toname, op, data, message.responsive as true, name);
                if (message.responsive) {
                    worker.postMessage({
                        data:       res,
                        event:      ServiceEvents.RESPONSE,
                        id:         randomUUID(),
                        responseTo: message.id
                    });
                }
                break;
            }

            case ServiceEvents.MASTER_COMMAND: {
                const op = (message.data as { op: string; }).op;
                const data = (message.data as { data?: unknown; }).data;
                const res = await this.handleMessage(worker, name, op, data);
                if (message.responsive) {
                    worker.postMessage({
                        data:       res,
                        event:      ServiceEvents.RESPONSE,
                        id:         randomUUID(),
                        responseTo: message.id
                    });
                }
                break;
            }
        }
    }
    private static workerToName(worker: Worker) {
        return [...this.services.entries()].find(([, w]) => w === worker)?.[0];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async handleMessage(worker: Worker, from: string, op: string, data?: unknown): Promise<void> {
        if (from === "auto-posting") {
            switch (op) {
                case "ATTEMPT_CROSSPOST": {
                    const { channelID, messageID } = data as { channelID: string; messageID: string; };
                    const channel = await MaidBoye.INSTANCE.getGuildChannel(channelID);
                    if (channel && channel.type === ChannelTypes.GUILD_ANNOUNCEMENT && channel.permissionsOf(Config.clientID).has("MANAGE_MESSAGES")) {
                        await MaidBoye.INSTANCE.rest.channels.crosspostMessage(channelID, messageID);
                    }
                    break;
                }

                case "AUTOPOST_FAILURE": {
                    const { bypassRequirements, entry: entryID } = data as { bypassRequirements: boolean; entry: string; };
                    const entry = await AutoPostingEntry.get(entryID);
                    if (!entry) {
                        Logger.getLogger("AutoPosting").warn(`Received autopost failure for unknown entry "${entryID}".`);
                        return;
                    }
                    await AutoPostingWebhookFailureHandler.tick(entry, bypassRequirements);
                    break;
                }

                default: {
                    Logger.getLogger("Services").warn(`Unknown master command "${op}" from service "auto-posting".`);
                }
            }
        } else {
            Logger.getLogger("Services").warn(`Unknown master command "${op}" from service "${from}".`);
        }
    }

    static async register(name: string, path: string | URL, timeout = 30000, waitForReady = true) {
        if (path instanceof URL) {
            path = path.pathname;
        }
        Logger.getLogger("Services").info(`Registering service "${name}". Attempt: ${(this.exitCounts.get(name) ?? 0) + 1}`);
        const worker = new Worker(new URL(`WorkerRunner${import.meta.url.endsWith(".ts") ? ".ts" : ".js"}`, import.meta.url), { workerData: { name, path } });
        worker
            .on("message", this._handleMessage.bind(this, worker))
            .on("exit", code => {
                this.serviceStatuses.set(name, "dead");
                let exitCount: number;
                this.exitCounts.set(name, exitCount = (this.exitCounts.get(name) ?? 0) + 1);
                Logger.getLogger("Services").warn(`Service "${name}" exited with code ${code}. Total Attempts: ${exitCount}`);
                if (exitCount > 5) {
                    Logger.getLogger("Services").error(`Service "${name}" has exited too many times. Not restarting.`);
                    this.exitCounts.delete(name);
                } else {
                    const time = Math.floor(Math.pow(exitCount, 2.3) * 1000);
                    Logger.getLogger("Services").info(`Restarting service "${name}" in ${time}ms.`);
                    setTimeout(() => this.register(name, path), time);
                }
            });
        const p = new Promise((resolve, reject) => {
            this.services.set(name, worker);
            this.serviceStatuses.set(name, "starting");
            const t =  setTimeout(() => {
                if (this.serviceStatuses.get(name) === "starting") {
                    this.serviceStatuses.set(name, "dead");
                    this.cb.delete(name);
                    reject(new Error(`Starting service "${name}" timed out.`));
                }
            }, timeout);
            this.cb.set(name, {
                resolve(val) {
                    clearTimeout(t);
                    resolve(val);
                },
                reject
            });
        });

        return waitForReady ? p : Promise.resolve();
    }

    static async send<T = unknown>(name: string, op: string, data: unknown | string, responsive: true, from?: string): Promise<T>;
    static async send(name: string, op: string, data?: unknown, responsive?: false, from?: string): Promise<void>;
    static async send<T = unknown>(name: string, op: string, data?: unknown, responsive = false, from?: string): Promise<T | void> {
        if (this.serviceStatuses.get(name) !== "ready") {
            throw new Error(`Attempted to send message to service "${name}" that is not ready.`);
        }

        const id = randomUUID();
        this.services.get(name)?.postMessage({
            id,
            event: ServiceEvents.WORKER_COMMAND,
            data:  { op, data },
            responsive,
            from
        });

        if (responsive) {
            return new Promise((resolve, reject) => {
                const t = setTimeout(() => {
                    this.cb.delete(id);
                    reject(new Error(`Sending message to service "${name}" timed out.`));
                }, 30000);
                this.cb.set(id, {
                    resolve(val) {
                        clearTimeout(t);
                        resolve((val as ServiceMessage).data as T);
                    },
                    reject
                });
            });
        }
    }
}
