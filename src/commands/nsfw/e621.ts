import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import { apiKeys, developers, emojis, userAgent } from "@config";
import Eris, { DiscordRESTError } from "eris";
import ComponentHelper from "@util/components/ComponentHelper";
import type MaidBoye from "@MaidBoye";
import E621 from "@req/E621";
import fetch from "node-fetch";
import Logger from "@util/Logger";
import ErrorHandler from "@handlers/ErrorHandler";

// attachment version: https://pastebin.com/D4ZBuLjw
export default new Command("e621", "e6")
	.setPermissions("bot", "embedLinks", "attachFiles")
	.setDescription("Search for posts from e621")
	.setUsage("[tags]")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "tags",
			description: "The tags to search with (default order: favcount), max 40",
			required: false
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "no-video",
			description: "If we should filter out video files",
			required: false,
			choices: [
				{
					name: "Yes",
					value: "--no-video"
				},
				{
					name: "No",
					value: ""
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
			name: "no-flash",
			description: "If we should filter out flash files",
			required: false,
			choices: [
				{
					name: "Yes",
					value: "--no-flash"
				},
				{
					name: "No",
					value: ""
				}
			]
		}
	])
	.setRestrictions("nsfw")
	.setCooldown(3e3)
	.setParsedFlags("no-video", "no-flash")
	.setExecutor(async function(msg) {
		try {
			const tags = Array.from(msg.rawArgs).map(t => t.toLowerCase());
			if (!tags.find(t => t.includes("order:"))) tags.push("order:favcount");
			if (["cub", "young"].some(v => tags.includes(v))) return msg.reply("H-hey! You tried using a blacklisted tag, don't do that!");
			const unfilteredPosts = await E621.posts.search({ tags, limit: 100 });
			if (unfilteredPosts.length === 0) return msg.reply("H-hey! We didn't find any results with what you provided..");
			const filterWebm = msg.dashedArgs.value.includes("no-video");
			const filterFlash = msg.dashedArgs.value.includes("no-flash");
			const posts = unfilteredPosts.filter(p => !(filterWebm && p.file.ext === "webm") && !(filterFlash && p.file.ext === "swf"));

			let m: Eris.Message<Eris.GuildTextableChannel> | undefined, i = 0;
			async function changePost(this: MaidBoye, id?: string, token?: string): Promise<void> {
				if (i < 0) i = 0;
				if (i > (posts.length - 1)) i = posts.length - 1;
				const post = posts[i];
				const e = new EmbedBuilder()
					.setTitle(`E621 | Tags: ${msg.rawArgs.length === 0 ? "None" : `"${msg.rawArgs.join(" ").slice(0, 500)}"`}`)
					.setColor(post.rating === "s" ? "green" : post.rating === "q" ? "gold" : post.rating === "e" ? "red" : "bot")
					.setFooter(`Post #${post.id} | ${i + 1}/${posts.length} | ${post.score.up} ${emojis.default.up} ${post.score.down} ${emojis.default.down} | ${post.fav_count} ${emojis.default.heart}`)
					.removeDescription();
				if (id && token) await this.createInteractionResponse(id, token, { type: Eris.Constants.InteractionResponseTypes.DEFERRED_UPDATE_MESSAGE });

				if (post.tags.general.includes("young")) {
					posts.splice(i, 1);
					return changePost.call(this, undefined, token);
				}

				if (post.file.ext === "swf") {
					e.setDescription(`This post is a flash animation. Please view it [directly](https://e621.net/posts/${post.id}) on e621.`);
				} else if (post.file.ext === "webm") {
					e.setDescription(`This post is a video. Please view it [directly](https://e621.net/posts/${post.id}) on e621.`);
					if (msg.gConfig.settings.e621ThumbnailType !== "none") {
						e.setImage("https://http.cat/500");
					}
				} else e.setImage(post.file.url);
				e.setDescription(e.getDescription()!, "(post numbers may fluctuate as we filter things)");
				let a: string;
				if (post.tags.artist.length === 0) a = "unknown_artist";
				else if (post.tags.artist.length === 1) a = post.tags.artist[0];
				else a = post.tags.artist.find(v => !["conditional_dnp", "sound_warning"].includes(v)) || "unknown_artist";
				post.sources.forEach((source, index) => {
					if (!source.startsWith("http") || !source.startsWith("https")) {
						Logger.getLogger("E621Command").info("Found post with invalid source, https://e621.net/posts/%d", post.id);
						post.sources.splice(index, 1);
					}
				});
				const c = new ComponentHelper()
					.addURLButton(`https://e621.net/posts/${post.id}`, false, undefined, "Open Post")
					.addURLButton(post.file.url, false, undefined, "Full Image")
					.addURLButton(post.sources[0] || `https://e621.net/${post.id}`, post.sources.length === 0, undefined, "Source")
					.addURLButton(`https://e621.net/artists/show_or_new?name=${a}`, false, undefined, `Artist: ${a}`)
					.addInteractionButton(
						post.rating === "s" ? ComponentHelper.BUTTON_SUCCESS :
							post.rating === "q" ? ComponentHelper.BUTTON_PRIMARY :
								post.rating === "e" ? ComponentHelper.BUTTON_DANGER :
									ComponentHelper.BUTTON_SUCCESS, `e621-rating.${msg.author.id}`, true, undefined, `Rating: ${post.rating === "s" ? "Safe" : post.rating === "q" ? "Questionable" : post.rating === "e" ? "Explicit" : "Unknown"}`)
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `e621-first.${msg.author.id}`, i === 0, ComponentHelper.emojiToPartial(emojis.default.first, "default"), "First")
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `e621-back.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.back, "default"), "Back")
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `e621-stop.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.stop, "default"), "Stop")
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `e621-next.${msg.author.id}`, false, ComponentHelper.emojiToPartial(emojis.default.next, "default"), "Next")
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `e621-last.${msg.author.id}`, i === (posts.length - 1), ComponentHelper.emojiToPartial(emojis.default.last, "default"), "Last")
					.toJSON();
				if (m === undefined) m = await msg.reply({
					embeds: [e.toJSON()],
					components: c
				});
				else {
					if (!token) return;
					// @FIXME change this if original methods get added
					await this.editWebhookMessage(this.user.id, token, "@original", {
						embeds: [e.toJSON()],
						components: c
					}).catch(() => null);
				}

				const wait = await msg.channel.awaitComponentInteractions(3e5, (it) => it.channel.id === msg.channel.id && it.message.id === m!.id && it.data.custom_id.startsWith("e621-") && it.data.custom_id.endsWith(msg.author.id) && it.member!.user.id === msg.author.id);
				if (wait === null) {
					await m.edit({
						components: m.components?.slice(0, 1)
					}).catch(() => null);
					return;
				} else {
					if (wait.data.custom_id.includes("first")) i = 0;
					if (wait.data.custom_id.includes("back")) i--;
					if (wait.data.custom_id.includes("stop")) {
						i = -1;
						await m.edit({
							embeds: m.embeds,
							components: m.components?.slice(0, 1)
						});
						return;
					}
					if (wait.data.custom_id.includes("next")) i++;
					if (wait.data.custom_id.includes("last")) i = posts.length - 1;
					if (i === -1) return;
					return changePost.call(this, wait.id, wait.token);
				}
			}

			void changePost.call(this);
		} catch (err) {
			if (err instanceof DiscordRESTError) return ErrorHandler.handleDiscordError(err, msg);
			else throw err;
		}
	});
