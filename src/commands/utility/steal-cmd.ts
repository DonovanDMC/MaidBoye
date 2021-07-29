import Command from "@cmd/Command";
import config from "@config";
import Logger from "@util/Logger";
import CommandError from "@cmd/CommandError";
import Eris from "eris";
import fetch from "node-fetch";
import Tinify from "tinify";
import { ApplicationCommandOptionType } from "discord-api-types";
import { URL } from "url";

export default new Command("steal")
	.setPermissions("bot", "embedLinks", "attachFiles", "manageEmojis")
	.setPermissions("user", "manageEmojis")
	.setDescription("Steal an emoji for this server, or create one from a url")
	.setUsage("<emoji/url>")
	.setSlashOptions(true, [
		{
			type: ApplicationCommandOptionType.String,
			name: "input",
			description: "The emoji or url you want to steal",
			required: true
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "name",
			description: "What to name the emoji (default original name, or filename)",
			required: false
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg, cmd) {
		if (msg.args.length < 1) return new CommandError("INVALID_USAGE", cmd);
		if (msg.args[0].toLowerCase() === "attachment") {
			const [a = null] = msg.attachments.filter(at => at.content_type && at.content_type.startsWith("image/"));
			if (a !== null) msg.args = [a.url, ...msg.args.slice(1)];
		}
		const e = /(?:<a?:(.*):)?([0-9]{15,21})(?:>)?/i.exec(msg.args[0]);

		// https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)
		const id = e?.[2];
		let name = msg.args.slice(1).join(" ") || e?.[1] || id, m: Eris.Message<Eris.GuildTextableChannel> | undefined;

		if (!id) {
			if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(msg.args[0])) {
				const url = new URL(msg.args[0]);
				if (!name) name = url.pathname.substring(url.pathname.lastIndexOf("/") + 1).replace(/\.(png|jpe?g|gif|webp)/, "").slice(0, 32);
				m = await msg.reply("Fetching Image...");
				await msg.channel.sendTyping();
			} else return msg.reply("I-I couldn't find an emoji or url with what you provided..");
		}

		if (!name) name = "Unknown";

		const img = await fetch(`https://proxy-request.yiff.workers.dev?url=${encodeURIComponent(!id ? msg.args[0] : `https://cdn.discordapp.com/emojis/${id}`)}`, {
			headers: {
				"Authorization": config.apiKeys.proxyReq,
				"User-Agent": config.userAgent
			}
		});
		const og = await img.buffer();
		let b: Uint8Array;
		if (og.byteLength > 256000) {
			if (m) await m.edit("Resizing Image...");
			try {
				b = await Tinify.fromBuffer(og).toBuffer();
			} catch (err) {
				if (m) await m.delete();
				await msg.reply("o-our compression service returned an error.. You will need to manually resize t-the provided file to under 256kb..");
				Logger.error(`Error while running Tinify for the url "${img.url}",`, err);
				return;
			}
		} else b = og;

		if (name.length < 2 || name.length > 32) return msg.reply("H-hey! The name must be between 2 and 32 characters.");

		if (m) await m.delete();
		if (img.status !== 200) return msg.reply("I-I couldn't find an emoji or url with what you provided..");

		await msg.channel.guild.createEmoji({
			name,
			image: `data:${img.headers.get("Content-Type")!};base64,${Buffer.from(b).toString("base64")}`
		}, encodeURIComponent(`steal command: ${msg.author.tag} (${msg.author.id})`)).then(j =>
			msg.reply(`Created the emoji <${j.animated ? "a" : ""}:${j.name}:${j.id}> w-with the name **${j.name}**..`)
		).catch(error  => {
			const err = error as Error & { code: number; };
			if ("code" in err) switch (err.code) {
				case 30008: return msg.reply(`th-this server already has the maximum amount of emojis (${((/\((\d+)\)/.exec(err.message)) ?? [0])[1]}), so I cannot add any more.`);
				case 50035: {
					if (err.message.indexOf("File cannot be larger than 256.0 kb") !== -1) return msg.reply("I-I wasn't able to resize the provided file under 256kb.. Please manually do this yourself.");
					if (err.message.indexOf("name: String value did not match validation regex.") !== -1) return msg.reply("D-discord didn't like something about the name you provided.. Try again with something else.");
					break;
				}
			}
			return msg.reply(`S-sorry! We failed to create that emoji, reason: **${err.name}: ${err.message}**`);
		});
	});
