import ClientEvent from "@util/ClientEvent";
import EmbedBuilder from "@util/EmbedBuilder";
import GuildConfig from "@db/Models/Guild/GuildConfig";
import LoggingWebhookFailureHandler from "@util/handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("threadMembersUpdate", async function(thread, removedMembers, addedMembers) {
	// waiting on pr updates
	if (
		removedMembers === undefined ||
		addedMembers === undefined ||
		(
			removedMembers.filter(Boolean).length === 0 &&
			addedMembers.filter(Boolean).length === 0
		)
	) return;
	if (!("guild" in thread)) return;

	if (addedMembers.length > 0) {
		const logEvents = await GuildConfig.getLogEvents(thread.guild.id, "threadJoin");
		for (const log of logEvents) {
			const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
			if (hook === null || !hook.token) {
				void LoggingWebhookFailureHandler.tick(log);
				continue;
			}

			await this.executeWebhook(hook.id, hook.token, {
				embeds: [
					new EmbedBuilder(true)
						.setTitle("Thread Join")
						.setColor("green")
						.setDescription([
							`Thread: <#${thread.name}>`,
							"Some people joined this thread.",
							"",
							"**Members**:",
							...addedMembers.map(m => `<@!${m.id}>`)
						])
						.toJSON()
				]
			});
		}
	}

	if (removedMembers.length > 0) {
		const logEvents = await GuildConfig.getLogEvents(thread.guild.id, "threadLeave");
		for (const log of logEvents) {
			const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
			if (hook === null || !hook.token) {
				await log.delete();
				continue;
			}

			await this.executeWebhook(hook.id, hook.token, {
				embeds: [
					new EmbedBuilder(true)
						.setTitle("Thread Leave")
						.setColor("red")
						.setDescription([
							`Thread: <#${thread.name}>`,
							"Some people left this thread.",
							"",
							"**Members**:",
							...removedMembers.map(m => `<@!${m.id}>`)
						])
						.toJSON()
				]
			});
		}
	}
});
