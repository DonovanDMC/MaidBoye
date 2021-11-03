import type LogEvent from "@db/Models/Guild/LogEvent";
import type MaidBoye from "@MaidBoye";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";

export default class LoggingWebhookFailureHandler {
	static WINDOW_TIME = 2.16e+7; // failure window is 6 hours
	static WINDOW_TOTAL = 5; // 5 failures in 6 hours will trigger deletion
	static list: Array<[time: number, amount: number, id: string]> = [];
	static client: MaidBoye;
	static setClient(client: MaidBoye) { this.client = client; }

	static async tick(log: LogEvent) {
		const dt = Date.now();
		if (!this.client) return -1 as const;
		this.list = this.list.filter(([t]) => t > dt);
		Logger.getLogger("LoggingWebhookFailureHandler").warn(`Failure for event "${log.event}" (webhook: ${log.webhook.id}, channel: ${log.webhook.channel}, guild: ${this.client.channelGuildMap[log.webhook.channel] ?? "Unknown"})`);
		// eslint-disable-next-line prefer-const
		let [time = (dt + this.WINDOW_TIME), amount = null] = this.list.find(([, , d]) => log.id === d) ?? [];
		if (amount === null) {
			this.list.push([time, 1, log.id]);
			return 1;
		} else {
			amount++;
			if (amount >= this.WINDOW_TOTAL) {
				const hook = await this.client.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
				// do nothing if the webhook still exists
				if (hook !== null) {
					this.list.splice(this.list.findIndex(([, a, b]) => a === amount && b === log.id), 1);
					this.list.push([time, amount, log.id]);
					return this.WINDOW_TOTAL;
				}
				const ch = await this.client.getGuildChannel(log.webhook.channel);
				// assume channel deleted if null
				if (ch !== null && ("createMessage" in ch)) {
					void ch.createMessage({
						embeds: [
							new EmbedBuilder()
								.setTitle("Logging Disabled")
								.setDescription(`Logging of the event "${log.event}"" was disabled due to repeated failures.`)
								.setColor("red")
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
