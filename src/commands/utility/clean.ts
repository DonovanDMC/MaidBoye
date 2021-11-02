import Command from "@cmd/Command";
import MessageCollector from "@util/MessageCollector";
import Eris from "eris";

export default new Command("clean", "clear", "prune", "purge")
	.setPermissions("bot", "embedLinks", "manageMessages")
	.setPermissions("user", "manageMessages")
	.setDescription("Clean up some messages")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.INTEGER,
			name: "amount",
			description: "Amount of messages to delete, between 2 and 1000",
			required: true
		}
	])
	.setUsage("<2-1000>")
	.setCooldown(5e3)
	.setExecutor(async function(msg) {
		if (msg.args.length === 0) return msg.reply(`H-hey! You have to provide some arguments, silly.. See \`${msg.gConfig.getFormattedPrefix()}help clean\` for help`);
		const amount = Number(msg.args[0]);
		if (amount < 2) return msg.reply("H-hey! You have to provide a number 2 or higher!");
		if (amount > 1000) return msg.reply("H-hey! You have to provide a number 1000 or lower!");
		if (isNaN(amount)) return msg.reply("H-hey! You have to provide a number for the amount!");


		await msg.channel.sendTyping();
		const typing = setInterval(() => msg.channel.sendTyping(), 7e3);
		const time = setTimeout(() => {
			clearInterval(typing);
		}, 7.5e4);

		const messages = await msg.channel.getMessages({ limit: amount });
		let filteredDate = 0;
		const filtered = messages.filter(m => {
			if (m.createdAt < (Date.now() - 1.21e+9)) {
				filteredDate++;
				return false;
			} else return true;
		});

		const count = await msg.reply(`We got **${messages.length}** total messages, with **${filteredDate}** being more than 2 weeks old.\nAre you sure you want to delete **${filtered.length}** messages?`);
		if (filtered.length < 2) {
			clearInterval(typing);
			clearTimeout(time);
			return msg.reply("There weren't any messages left over after filtering..");
		}

		clearInterval(typing);
		clearTimeout(time);
		const sendCancel = await msg.channel.createMessage("Send \"cancel\" within 5 seconds to cancel message deletion..");
		const waitCancel = await MessageCollector.awaitMessages(msg.channel.id, 5e3, (m) => m.author.id === msg.author.id);
		if (waitCancel !== null && waitCancel.content.toLowerCase() === "cancel") {
			await count.delete();
			await sendCancel.delete();
			await waitCancel.delete().catch(() => null);
			return msg.reply("Cancelled.");
		}
		await sendCancel.edit("Running...");
		if (filtered.length > amount) filtered.forEach((f, i) =>
			i > (amount + 1) ? filtered.splice(i, 1) : null
		);

		const typing2 = setInterval(() => msg.channel.sendTyping(), 7e3);
		const time2 = setTimeout(() => {
			clearInterval(typing);
		}, 6e4);
		await msg.channel.deleteMessages(filtered.map(m => m.id));


		clearInterval(typing2);
		clearTimeout(time2);
		return sendCancel.edit(`Successfully cleaned up **${filtered.length}** messages. **${filteredDate}** were removed due to them being over 2 weeks old.`);
	});
