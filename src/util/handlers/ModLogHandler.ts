import db from "../../db";
import GuildConfig from "../../db/Models/GuildConfig";
import MaidBoye from "../../main";

export default class ModLogHandler {
	static async check(guild: string | GuildConfig, client: MaidBoye) {
		if (!(guild instanceof GuildConfig)) guild = await db.getGuild(guild);
		if (guild.modlog.enabled === true) {
			if (guild.modlog.webhook === null) await guild.mongoEdit({
				$set: {
					"modlog.enabled": false
				}
			});
			else {
				if (!guild.modlog.webhook.id || !guild.modlog.webhook.token) await guild.mongoEdit({
					$set: {
						"modlog.enabled": false,
						"modlog.webhook": null
					}
				});
				else {
					const wh = await client.getWebhook(guild.modlog.webhook.id, guild.modlog.webhook.token).catch(() => null);
					if (wh === null) await guild.mongoEdit({
						$set: {
							"modlog.enabled": false,
							"modlog.webhook": null
						}
					});
					else {
						if (!guild.modlog.webhook.channelId) await guild.mongoEdit({
							$set: {
								"modlog.webhook.channelId": wh.channel_id
							}
						});
					}
				}
			}
		}

		return guild.reload().then((r) => r.modlog.enabled);
	}
}
