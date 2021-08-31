import Command from "@cmd/Command";
import db from "@db";
import BotFunctions from "@util/BotFunctions";
import ComponentHelper from "@util/ComponentHelper";
import EmbedBuilder from "@util/EmbedBuilder";
import Yiffy from "@util/req/Yiffy";

export default new Command("marry")
	.setPermissions("bot", "embedLinks")
	.setDescription("Marry someone..")
	.setUsage("<@user>")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.args.length < 1) return msg.reply("H-hey! You have to provide someone to marry..");
		const member = await msg.getMemberFromArgs();
		if (member === null) return msg.reply("H-hey! That wasn't a valid member..");
		if (msg.uConfig.marriage !== null) return msg.reply("H-Hey! You're already married..");
		if (msg.author.id === member.id) return msg.reply("H-hey! You can't marry yourself..");
		if (member.bot === true) return msg.reply("H-hey! You can't marry a bot..");
		const other = await db.getUser(member.id);
		if (other.marriage !== null) return msg.reply("H-hey! They're already married..");

		const img = await Yiffy.furry.propose("json", 1);
		const m = await msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Marriage Proposal")
					.setDescription(`<@!${msg.author.id}> has proposed to <@!${member.id}>!\n<@!${member.id}> do you accept?\n\n(this will time out at ${BotFunctions.formatDiscordTime(Date.now() + 3e5, "short-time")})`)
					.setImage(img.url)
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SUCCESS, `marry-yes.${member.id}`, false, undefined, "Yes")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `marry-no.${member.id}`, false, undefined, "No")
				.toJSON()
		});
		const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.message.id === m.id && it.member!.user.id === member.id && it.data.custom_id.startsWith("marry-"));
		if (wait === null || wait.data.custom_id.includes("no")) return m.edit({
			content: "Better luck next time..",
			embeds: [],
			components: []
		}).catch(() => null);
		else {
			await msg.uConfig.edit({
				marriage: member.id
			});
			await other.edit({
				marriage: msg.author.id
			});

			await m.edit({
				content: "",
				embeds: [
					new EmbedBuilder(true, msg.author)
						.setTitle("Congrats!")
						.setDescription(`Congrats <@!${msg.author.id}> and <@!${member.id}>`)
						.setImage(img.url)
						.toJSON()
				],
				components: []
			});
		}
	});
