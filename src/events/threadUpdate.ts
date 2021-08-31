import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import { Time } from "@uwu-codes/utils";
import Eris from "eris";
import BotFunctions from "@util/BotFunctions";

export default new ClientEvent("threadUpdate", async function(thread, oldThread) {
	if (!("guild" in thread) || oldThread === null) return;

	const logEvents = await GuildConfig.getLogEvents(thread.guild.id, "threadUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			await log.delete();
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		if (oldThread.name !== thread.name) embeds.push(new EmbedBuilder(true)
			.setTitle("Thread Updated")
			.setColor("gold")
			.setDescription([
				`Thread: <#${thread.id}>`,
				"This thread's name was changed."
			])
			.addField("Old Thread Name", oldThread.name, false)
			.addField("New Thread Name", thread.name, false)
			.toJSON()
		);

		if (oldThread.rateLimitPerUser !== thread.rateLimitPerUser) embeds.push(new EmbedBuilder(true)
			.setTitle("Thread Updated")
			.setColor("gold")
			.setDescription([
				`Thread: <#${thread.id}>`,
				"This thread's Slow Mode was changed."
			])
			.addField("Old SlowMode", Time.ms(oldThread.rateLimitPerUser * 1000, true), false)
			.addField("New SlowMode", Time.ms(thread.rateLimitPerUser * 1000, true), false)
			.toJSON()
		);

		if (oldThread.threadMetadata.archived !== thread.threadMetadata.archived) embeds.push(new EmbedBuilder(true)
			.setTitle("Thread Updated")
			.setColor("gold")
			.setDescription([
				`Thread: <#${thread.id}>`,
				oldThread.threadMetadata.archived === false ? "This thread was archived." : "This thread was unarchived."
			])
			.toJSON()
		);

		if (oldThread.threadMetadata.autoArchiveDuration !== thread.threadMetadata.autoArchiveDuration) embeds.push(new EmbedBuilder(true)
			.setTitle("Thread Updated")
			.setColor("gold")
			.setDescription([
				`Thread: <#${thread.id}>`,
				"This thread's auto archive duration was changed."
			])
			.addField("Old Auto Archive Duration", Time.ms(oldThread.threadMetadata.autoArchiveDuration * 6e4, true), false)
			.addField("New Auto Archive Duration", Time.ms(thread.threadMetadata.autoArchiveDuration * 6e4, true), false)
			.toJSON()
		);

		if (oldThread.threadMetadata.locked !== thread.threadMetadata.locked) embeds.push(new EmbedBuilder(true)
			.setTitle("Thread Updated")
			.setColor("gold")
			.setDescription([
				`Thread: <#${thread.id}>`,
				oldThread.threadMetadata.locked === false ? "This thread was locked." : "This thread was unlocked."
			])
			.toJSON()
		);

		if (embeds.length === 0) continue;

		if (thread.guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(thread.guild, "THREAD_UPDATE", (a) => a.targetID === thread.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Thread Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
