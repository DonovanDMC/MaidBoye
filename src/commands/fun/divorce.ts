import Command from "@cmd/Command";
import UserConfig from "@models/User/UserConfig";
import ComponentHelper from "@util/components/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";

export default new Command("divorce")
	.setPermissions("bot", "embedLinks")
	.setDescription("Leave your spouse")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.uConfig.marriage === null) return msg.reply("H-hey! You aren't married..");

		const m = await msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Divorce")
					.setDescription(`Are you sure you want to divorce <@!${msg.uConfig.marriage}>?`)
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `divorce-yes.${msg.author.id}`, false, undefined, "Yes")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `divorce-no.${msg.author.id}`, false, undefined, "No")
				.toJSON()
		});
		const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.message.id === m.id && it.member!.user.id === msg.author.id && it.data.custom_id.startsWith("marry-"));
		if (wait === null || wait.data.custom_id.includes("no")) return m.edit({
			content: "Cancelled.",
			embeds: [],
			components: []
		}).catch(() => null);
		await msg.uConfig.edit({ marriage: null });
		await UserConfig.prototype.edit.call({ id: msg.uConfig.marriage }, { marriage: null });
		return m.edit({
			content: "Done.",
			embeds: [],
			components: []
		});
	});
