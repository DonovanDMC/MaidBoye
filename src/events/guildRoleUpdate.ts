import ClientEvent from "@util/ClientEvent";
import GuildConfig from "@models/Guild/GuildConfig";
import EmbedBuilder from "@util/EmbedBuilder";
import type Eris from "eris";
import BotFunctions from "@util/BotFunctions";
import { permissionNames } from "@config";
import LoggingWebhookFailureHandler from "@handlers/LoggingWebhookFailureHandler";

export default new ClientEvent("guildRoleUpdate", async function(guild, role, oldRole) {

	const logEvents = await GuildConfig.getLogEvents(guild.id, "roleUpdate");
	for (const log of logEvents) {
		const hook = await this.getWebhook(log.webhook.id, log.webhook.token).catch(() => null);
		if (hook === null || !hook.token) {
			void LoggingWebhookFailureHandler.tick(log);
			continue;
		}

		const embeds = [] as Array<Eris.EmbedOptions>;

		if (oldRole.color !== role.color) embeds.push(new EmbedBuilder(true)
			.setTitle("Role Updated")
			.setColor("gold")
			.setDescription([
				`Role: <@&${role.id}>`,
				"The role's color was changed."
			])
			.addField("Old Color", `#${oldRole.color === 0 ? "[NONE]" : oldRole.color.toString(16).padStart(6, "0").toUpperCase()}`, false)
			.addField("New Color", `#${role.color === 0 ? "[NONE]" : role.color.toString(16).padStart(6, "0").toUpperCase()}`, false)
			.toJSON()
		);

		if (oldRole.hoist !== role.hoist) embeds.push(new EmbedBuilder(true)
			.setTitle("Role Updated")
			.setColor("gold")
			.setDescription([
				`Role: <@&${role.id}>`,
				oldRole.hoist === false ? "This role was hoisted." : "This role was unhoisted."
			])
			.toJSON()
		);

		// managed should never change

		if (oldRole.mentionable !== role.mentionable) embeds.push(new EmbedBuilder(true)
			.setTitle("Role Updated")
			.setColor("gold")
			.setDescription([
				`Role: <@&${role.id}>`,
				oldRole.mentionable === false ? "This role was made mentionable." : "This role was made not mentionable."]
			)
			.toJSON()
		);

		if (oldRole.name !== role.name) embeds.push(new EmbedBuilder(true)
			.setTitle("Role Updated")
			.setColor("gold")
			.setDescription([
				`Role: <@&${role.id}>`,
				"The role's name was changed."
			])
			.addField("Old Name", oldRole.name, false)
			.addField("New Name", role.name, false)
			.toJSON()
		);

		if (oldRole.permissions.allow !== role.permissions.allow) {
			const oldPermissions = Object.entries(oldRole.permissions.json).filter(([,b]) => b === true).map(([a]) => a);
			const newPermissions = Object.entries(role.permissions.json).filter(([,b]) => b === true).map(([a]) => a);
			const addedPermissions = [] as Array<string>;
			const removedPermissions = [] as Array<string>;
			oldPermissions.forEach(p => {
				if (!newPermissions.includes(p)) removedPermissions.push(p);
			});
			newPermissions.forEach(p => {
				if (!oldPermissions.includes(p)) addedPermissions.push(p);
			});
			embeds.push(new EmbedBuilder(true)
				.setTitle("Role Updated")
				.setColor("gold")
				.setDescription([
					`Role: <@&${role.id}>`,
					"The role's permissions were changed.",
					"",
					"**Changes**:",
					"```diff",
					...addedPermissions.map(p => `+ ${permissionNames[p as keyof typeof permissionNames]}`),
					...removedPermissions.map(p => `- ${permissionNames[p as keyof typeof permissionNames]}`),
					"```"
				])
				.toJSON()
			);
		}

		// we ignore position changes because MANY can be spammed in a row
		// when moving roles

		if (embeds.length === 0) continue;

		if (guild.permissionsOf(this.user.id).has("viewAuditLog")) {
			const audit = await BotFunctions.getAuditLogEntry(guild, "ROLE_UPDATE", (a) => a.targetID === role.id);
			if (audit !== null && (audit.createdAt + 5e3) > Date.now()) embeds.push(new EmbedBuilder(true)
				.setTitle("Role Update: Blame")
				.setDescription(`${audit.user.tag} (${audit.user.id})`)
				.setColor("orange")
				.toJSON());
		}

		await this.executeWebhook(hook.id, hook.token, { embeds });
	}
});
