import Command from "@cmd/Command";
import Eris from "eris";
import EmbedBuilder from "@util/EmbedBuilder";
import { DeprecatedPermissions, deprecatedPermissions, FakePermissions, fakePermissions, Permissions } from "@util/Constants";
import { permissionNames } from "@config";

export default new Command("permissions", "perms")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get the permission info of a user")
	.setUsage("[@user]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.USER,
			name: "user",
			description: "The user to check permissions of",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const member = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		if (member === null) return msg.reply("H-hey! That wasn't a valid member..");

		const permAllowed = [] as Array<Permissions>;
		const permDenied = [] as Array<Permissions>;
		Object
			.entries(Eris.Constants.Permissions)
			.filter(([name]) =>
				!deprecatedPermissions.includes(name as DeprecatedPermissions) &&
				!fakePermissions.includes(name as FakePermissions)
			)
			.map(([name, perm]) =>
				(((member.permissions.allow & perm) === perm) ? permAllowed : permDenied).push(name as Permissions)
			);

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle(`Permissions for ${member.tag}`)
					.setDescription([
						"```diff",
						...permAllowed.map(p => `+ ${permissionNames[p] || p}`),
						...permDenied.map(p => `- ${permissionNames[p] || p}`),
						"```"
					])
					.toJSON()
			]
		});
	});
