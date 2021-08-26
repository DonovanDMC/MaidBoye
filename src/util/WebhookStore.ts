import { botIcon, webhooks } from "@config";
import MaidBoye from "@MaidBoye";
import { GuildTextableChannel, Message, WebhookPayload } from "eris";

interface WebhookInfo {
	id: string;
	token: string;
	name?: string;
	avatar?: string;
}

class Webhook {
	private info: WebhookInfo;
	private client: MaidBoye;
	constructor(info: WebhookInfo, client: MaidBoye) {
		this.info = info;
		this.client = client;
	}

	async execute(payload: WebhookPayload, wait: true): Promise<Message<GuildTextableChannel>>;
	async execute(payload: WebhookPayload, wait?: false): Promise<void>;
	async execute(payload: WebhookPayload, wait = false): Promise<void | Message<GuildTextableChannel>> {
		if (!payload.username && this.info.name) payload.username = this.info.name;
		if (!payload.avatarURL) {
			if (this.info.avatar) payload.avatarURL = this.info.avatar;
			else payload.avatarURL = botIcon;
		}
		payload.wait = wait;
		return this.client.executeWebhook(this.info.id, this.info.token, payload);
	}

	async delete(reason?: string) { return this.client.deleteWebhook(this.info.id, this.info.token, reason); }
}

export default class WebhookStore {
	private static list = new Map<string, Webhook>();
	// this is now public for random client usage
	static client: MaidBoye;
	static setClient(client: MaidBoye) { this.client = client; }
	static get(name: keyof typeof webhooks) { return (this.list.get(name) ?? this.list.set(name, new Webhook(webhooks[name], this.client)).get(name))!; }

	static async execute(name: keyof typeof webhooks, payload: WebhookPayload, wait: true): Promise<Message<GuildTextableChannel>>;
	static async execute(name: keyof typeof webhooks, payload: WebhookPayload, wait?: false): Promise<void>;
	static async execute(name: keyof typeof webhooks, payload: WebhookPayload, wait = false): Promise<void | Message<GuildTextableChannel>> { return this.get(name).execute(payload, wait as true); }

	static async delete(name: keyof typeof webhooks, reason?: string) { return this.get(name).delete(reason); }
}
