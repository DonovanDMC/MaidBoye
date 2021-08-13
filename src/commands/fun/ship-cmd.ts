import Command from "@cmd/Command";
import config from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import Logger from "@util/Logger";
import FluxPoint from "@util/req/FluxPoint";
import Eris from "eris";

export default new Command("ship")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Ship two people")
	.setUsage("[@member1] [@member2]")
	.addApplicationCommand(Eris.Constants.CommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user1",
			description: "The first user to ship (none for random)",
			required: false
		},
		{
			type: Eris.Constants.CommandOptionTypes.USER,
			name: "user2",
			description: "The second user to ship (none for you)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setParsedFlags("percent", "random")
	.setExecutor(async function(msg) {
		let member1: Eris.Member | null = msg.member, member2: Eris.Member | null, amount = Math.floor(Math.random() * 100) + 1;
		if (Object.keys(msg.dashedArgs.keyValue).includes("percent")) {
			if (!config.developers.includes(msg.author.id)) return msg.reply("H-hey! That option is limited to developers only..");
			amount = Number(msg.dashedArgs.keyValue.percent);
		}

		if (msg.args.length === 0) member2 = msg.channel.guild.members.random() ?? null;
		else if (msg.args.length === 1) member2 = await msg.getMemberFromArgs(0, 0, true);
		else {
			member1 = await msg.getMemberFromArgs(0, 0, true);
			member2 = await msg.getMemberFromArgs(1, 1, true);
		}

		if (member1 === null || member2 === null) return msg.reply("H-hey! That wasn't a valid member..");

		if (!Object.keys(msg.dashedArgs.value).includes("random")) amount = Number((BigInt(member1.id) + BigInt(member2.id)) % 100n);
		// due to the way the math works, we can never get 100 & zero is possible,
		// so we add one
		amount++;
		// just in case
		if (amount < 1) amount = 1;
		if (amount > 100) amount = 100;

		const ship = {
			amount,
			name: member1.username.slice(0, Math.floor(Math.random() * 5) + 3) + member2.username.slice(-(Math.floor(Math.random() * 5) + 3)),
			get image() {
				if (this.amount === 1) return "1-percent";
				else if (this.amount >= 2 && this.amount <= 19) return "2-19-percent";
				else if (this.amount >= 20 && this.amount <= 39) return "20-39-percent";
				else if (this.amount >= 40 && this.amount <= 59) return "40-59-percent";
				else if (this.amount >= 60 && this.amount <= 79) return "60-79-percent";
				else if (this.amount >= 80 && this.amount <= 99) return "80-99-percent";
				else if (this.amount === 100) return "100-percent";
				else throw new Error(`Unexpected ship percentage "${this.amount}"`);
			}
		};

		const img = await FluxPoint.customGen({
			base: {
				type: "bitmap",
				x: 0,
				y: 0,
				width: 768,
				height: 256,
				color: "0, 0, 0, 0"
			},
			images: [
				{
					type: "url",
					url: member1.user.avatarURL,
					x: 0,
					y: 0,
					round: 0,
					width: 256,
					height: 256
				},
				{
					type: "url",
					url: `https://assets.maid.gay/ship/${ship.image}.png`,
					x: 256,
					y: 0,
					round: 0,
					width: 256,
					height: 256
				},
				{
					type: "url",
					url: member2.user.avatarURL,
					x: 512,
					y: 0,
					round: 0,
					width: 256,
					height: 256
				}
			],
			texts: [],
			output: "jpg"
		});

		if (!(img instanceof Buffer)) {
			Logger.error("FluxPoint Gen", img);
			throw new TypeError("Unknown Error");
		}

		return msg.reply({
			embed: new EmbedBuilder(true, msg.author)
				.setTitle("Shipping")
				.setDescription(`Shipping <@!${member1.id}> and <@!${member2.id}>\n**${ship.amount}%** - ${ship.name}`)
				.setFooter(config.emojis.default.blueHeart)
				.setImage("attachment://ship.png")
				.toJSON()
		}, {
			file: img,
			name: "ship.png"
		});
	});
