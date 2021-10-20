import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import BotFunctions from "@util/BotFunctions";
import type Eris from "eris";
import * as fs from "fs-extra";
import { apiURL, bulkDeleteDir } from "@config";
import crypto from "crypto";

//                                                                 this is messy because the event type specifies guild or dm, we only want guild
export default new ClientEvent("messageDeleteBulk", async function(messages: Array<Eris.Message<Eris.GuildTextableChannel> | { channel: Eris.GuildTextableChannel | { id: string; guild?: Eris.Uncached; }; guildID?: string; id: string; }>) {
	const guild = messages.find(m => "guild" in m.channel)?.channel?.guild;
	const [{ channel }] = messages;
	if (!guild || !("name" in guild)) return;
	if (!channel || !("name" in channel)) return;

	const logEvents = await GuildConfig.getLogEvents(guild.id, "bulkDelete");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const text = [
			"-- Begin Bulk Deletion Report --",
			`Generated At: ${new Date().toUTCString()}`,
			`Total Messages: ${messages.length}`,
			`Server: ${guild.name} (${guild.id})`,
			`Channel: ${channel.name} (${channel.id})`,
			"",
			"-- Begin Messages --",
			...messages.map(m => {
				const author = "author" in m ? `${m.author.tag} (${m.author.id})` : "Unknown Author";
				const d = new Date(Number((BigInt(m.id) / 4194304n) + 1420070400000n));
				return `[${d.toUTCString()}][${author}]: ${"content" in m ? m.content : "[No Content]"}`;
			}),
			"-- End Messages --",
			"",
			"-- Begin Disclaimers --",
			"* If you do not want bulk delete reports to be made, disable logging for Bulk Message Delete.",
			"* If you want this report deleted, contact a developer",
			"* Treat the report id like a password, anyone with it can read the contents.",
			"-- End Disclaimers --",
			"-- End Bulk Deletion Report --"
		].join("\n");
		const id = crypto.randomBytes(16).toString("hex");
		fs.writeFileSync(`${bulkDeleteDir}/${id}`, text);

		const e = new EmbedBuilder(true)
			.setTitle("Bulk Message Deletion")
			.setDescription([
				`Channel: <#${channel.id}>`,
				`Total Deleted: **${messages.length}**`,
				`Report: [here](${apiURL}/bulk-delete/${id})`
			])
			.setColor("red");

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "MESSAGE_BULK_DELETE", (a) => a.targetID === channel.id);
			if (audit !== null) e.addField("Blame", `${audit.user.tag} (${audit.user.id})`, false);
		}

		await this.executeWebhook(hook.id, hook.token, {
			embeds: [
				e.toJSON()
			]
		});
	}
});
