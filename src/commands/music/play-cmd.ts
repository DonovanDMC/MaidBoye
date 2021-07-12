import Command from "@cmd/Command";
import MessageCollector from "@util/MessageCollector";
import EmbedBuilder from "@util/EmbedBuilder";
import Eris from "eris";
import { Track } from "lavalink";
import { Time } from "@uwu-codes/utils";

export default new Command("play")
	.setPermissions("bot", "embedLinks")
	.setDescription("Play some music")
	.setUsage("<search>")
	.setHasSlashVariant(true)
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		if (msg.member.voiceState.channelID === null) return msg.reply("Y-you must be in a voice channel to use this command..");
		const ch = msg.channel.guild.channels.get(msg.member.voiceState.channelID) as Eris.VoiceChannel;
		const botCh = msg.channel.guild.channels.get(msg.channel.guild.me.voiceState.channelID!) as Eris.VoiceChannel | undefined;
		if (!botCh || botCh.voiceMembers.size === 1) await this.lava.players.get(msg.channel.guild.id).join(ch.id, { deaf: true });
		else if (ch.id !== botCh.id) return msg.reply(`H-hey! I'm already in a different voice channel (<#${botCh.id}>), I can't be in two at once..`);

		const { playlistInfo, loadType, tracks } = await this.lava.load(`ytsearch:${msg.args.join(" ")}`);
		let track: Track;
		if (loadType === "NO_MATCHES") return msg.reply("I-I couldn't find anything with what you provided..");
		let m: Eris.Message<Eris.GuildTextableChannel>;
		if (tracks.length === 1) track = tracks[0];
		else {
			m = await msg.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Select one of the following")
						.setDescription(
							tracks.slice(0, 10).map((t, i) => `**${i + 1}**.) [${t.info.title}](${t.info.uri}) \`${Time.secondsToHMS(t.info.length / 1000)}\``)
						)
						.toJSON()
				]
			});
			const col = await MessageCollector.awaitMessages(msg.channel.id, 6e4, (message) => message.author.id === msg.author.id);
			if (col === null) return m.edit({
				content: "You failed to select an option..",
				embeds: []
			});
			const n = Number(col.content);
			track = tracks[n];
			if (!track) return msg.reply("Your selection was invalid..");
			void col.delete().catch(() => null);
			await msg.gConfig.mongoEdit({
				$push: {
					queue: {
						addedAt: new Date().toISOString(),
						addedBy: msg.author.id,
						track
					}
				}
			});
			if (msg.gConfig.queue.length !== 1) return m.edit({
				content: "",
				embeds: [
					new EmbedBuilder()
						.setTitle("Added To Queue")
						.setDescription(`[${track.info.title}](${track.info.uri})`)
						.setFooter(`UwU | Added By: ${msg.author.tag}`)
						.toJSON()
				]
			});
			else {
				await this.lava.players.get(msg.channel.guild.id).play(track, { pause: false });
				return m.edit({
					content: "",
					embeds: [
						new EmbedBuilder()
							.setTitle("Now Playing")
							.setDescription(`[${track.info.title}](${track.info.uri})`)
							.setFooter(`UwU | Added By: ${msg.author.tag}`)
							.toJSON()
					]
				});
			}
		}
	});
