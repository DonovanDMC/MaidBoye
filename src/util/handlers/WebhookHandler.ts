import type MaidBoye from "../../main";
import webhooks from "../../config/private/webhooks.json" assert { type: "json" };
import type { ExecuteWebhookOptions, ExecuteWebhookWaitOptions, Message } from "oceanic.js";

export default class WebhookHandler {
    static client: MaidBoye;
    static webhooks = new Map<string, [id: string, token: string]>();
    static add(name: string, id: string, token: string) {
        this.webhooks.set(name, [id, token]);
        return this;
    }

    static execute(name: string, data: ExecuteWebhookWaitOptions): Promise<Message>;
    static execute(name: string, data: ExecuteWebhookOptions): Promise<void>;
    static execute(name: string, data: ExecuteWebhookOptions): Promise<Message | void> {
        const [id, token] = this.webhooks.get(name) ?? [];
        if (!id || !token) {
            throw new Error(`Webhook not found: ${name}`);
        }
        return this.client.rest.webhooks.execute(id, token, data);
    }

    static async init(client: MaidBoye) {
        this.client = client;
        for (const [name, { id, token }] of Object.entries(webhooks)) {
            WebhookHandler.add(name, id, token);
        }
    }
}
