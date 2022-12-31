import { ServiceEvents, type ServiceMessage } from "./ServicesManager.js";
import Debug from "./Debug.js";
import { randomUUID } from "node:crypto";
import { parentPort } from "node:worker_threads";

export default abstract class Service {
    private cb: Map<string, {
        reject(reason?: unknown): void;
        resolve(value?: unknown): void;
    }> = new Map();
    file: string;
    name: string;
    protected abstract handleMessage(op: string, data?: unknown, from?: string): Promise<unknown>;
    constructor(file: string, name: string) {
        this.file = file;
        this.name = name;
    }

    private async _handleMessage(message: ServiceMessage) {
        Debug(`services:${this.name}`, `Received message from master: ${JSON.stringify(message)}`);
        switch (message.event) {
            case ServiceEvents.WORKER_COMMAND: {
                const op = (message.data as { op: string; }).op;
                const data = (message.data as { data?: unknown; }).data;
                const res = await this.handleMessage(op, data, message.from);
                if (message.responsive) {
                    parentPort!.postMessage({
                        data:       res,
                        event:      ServiceEvents.RESPONSE,
                        id:         randomUUID(),
                        responseTo: message.id
                    });
                }
                break;
            }

            case ServiceEvents.RESPONSE: {
                if (!message.responseTo) {
                    throw new Error("Response message without responseTo.");
                }
                const cb = this.cb.get(message.responseTo);
                if (!message.responseTo) {
                    throw new Error("Response message without callback id.");
                }
                if (!cb) {
                    throw new Error("Response message without callback.");
                }
                this.cb.delete(message.responseTo);
                cb.resolve(message.data);
                break;
            }
        }
    }

    async masterCommand<T = unknown>(op: string, data: unknown | string, responsive: true): Promise<T>;
    async masterCommand(op: string, data?: unknown, responsive?: false): Promise<void>;
    async masterCommand<T = unknown>(op: string, data?: unknown, responsive = false): Promise<T | void> {
        const id = randomUUID();
        parentPort!.postMessage({
            id,
            event: ServiceEvents.MASTER_COMMAND,
            data:  { op, data },
            responsive
        });

        if (responsive) {
            return new Promise((resolve, reject) => {
                const t = setTimeout(() => {
                    this.cb.delete(id);
                    reject(new Error("Sending message to master timed out."));
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

    ready() {
        parentPort!.postMessage({
            event: ServiceEvents.READY,
            id:    randomUUID()
        });
        parentPort!.on("message", this._handleMessage.bind(this));
    }

    async sendToMaster<T = unknown>(event: ServiceEvents, data: unknown | undefined, responsive: true): Promise<T>;
    async sendToMaster(event: ServiceEvents, data?: unknown, responsive?: false): Promise<void>;
    async sendToMaster<T = unknown>(event: ServiceEvents, data?: unknown, responsive?: boolean): Promise<T | void> {
        const id = randomUUID();
        parentPort!.postMessage({
            event,
            data,
            id
        });
        if (responsive) {
            return new Promise((resolve,reject) => {
                this.cb.set(id, {
                    resolve,
                    reject
                });
                setTimeout(() => {
                    reject(new Error("Message to master timed out."));
                }, 10000);
            });
        }
    }
}

export class EmptyService extends Service {
    protected handleMessage(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
}
