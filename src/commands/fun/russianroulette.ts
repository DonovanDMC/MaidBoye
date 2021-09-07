import Command from "@cmd/Command";

export default new Command("russianroulette", "rr")
	.setPermissions("bot", "embedLinks")
	.setDescription("Play russianroulette")
	.setUsage("[bullets]")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const val = Math.floor(Math.random() * 6);
		const bullets = typeof msg.args[0] !== "undefined" ? Number(msg.args[0]) : 3;

		return msg.reply(`You ${val <= bullets - 1 ? "died.." : "lived!"}`);
	});
