import Command from "@cmd/Command";
import EmbedBuilder from "@util/EmbedBuilder";
import chunk from "chunk";
import BotFunctions from "@util/BotFunctions";
import Eris from "eris";

export default new Command("tag", "tags")
	.setPermissions("bot", "embedLinks")
	.setDescription("Manage this server's tags")
	.setUsage("<create/modify/list/help/tagname>")
	.addApplicationCommand(Eris.Constants.ApplicationCommandTypes.CHAT_INPUT, [
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "create",
			description: "[Management] create a tag",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "name",
					description: "The name of the tag",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "content",
					description: "The content of the tag",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "modify",
			description: "[Management] modify a tag",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "name",
					description: "The name of the tag to modify",
					required: true
				},
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "content",
					description: "The new content of the tag",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "delete",
			description: "[Management] Delete a tag",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "name",
					description: "The name of the tag to delete",
					required: true
				}
			]
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "list",
			description: "List the servers tags"
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "help",
			description: "Get help with using tags"
		},
		{
			type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
			name: "get",
			description: "Get a tag",
			options: [
				{
					type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
					name: "name",
					description: "The name of the tag to get",
					required: true
				}
			]
		}
	])
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		const sub = msg.rawArgs.length === 0 ? "help" : msg.rawArgs[0]?.toLowerCase();
		switch (sub) {
			case "create": {
				if (msg.gConfig.tags.size >= 50) return msg.reply("H-hey! This server has hit the tag limit (50).. Either delete some to make more, or contact a developer.");
				if (msg.args.length === 1) return msg.reply("H-hey! You have to provide a name for the tag..");
				if (msg.args.length === 2) return msg.reply("H-hey! You have to provide some content for the tag..");
				if (["create", "modify", "delete", "list", "help", "get"].includes(msg.rawArgs[1].toLowerCase())) return msg.reply(`H-hey! That name (**${msg.rawArgs[1].toLowerCase()}**) is a blacklisted name, you can't use it..`);
				if (msg.gConfig.tags.map(t => t.name).includes(msg.rawArgs[1].toLowerCase())) return msg.reply("H-hey! A tag already exists with that name..");
				const content = msg.rawArgs.slice(2).join(" ");
				if (content.length > 750) return msg.reply("H-hey! Tags have a hard limit of 750 characters..");
				await msg.gConfig.addTag({
					name: msg.rawArgs[1].toLowerCase(),
					content,
					createdAt: Date.now(),
					createdBy: msg.author.id
				});

				return msg.reply({
					content: `successfully created the tag **${msg.rawArgs[1].toLowerCase()}**, with the content:`,
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.setDescription(msg.rawArgs.slice(2).join(" "))
							.toJSON()
					]
				});
				break;
			}

			case "modify": {
				if (msg.gConfig.tags.size === 0) return msg.reply("th-this server doesn't have any tags to modify..");
				if (msg.args.length === 1) return msg.reply("H-hey! You have to provide a name for the tag..");
				if (msg.args.length === 2) return msg.reply("H-hey! You have to provide some content for the tag..");
				if (["create", "modify", "delete", "list", "help", "get"].includes(msg.rawArgs[1].toLowerCase())) return msg.reply(`H-hey! That name (**${msg.rawArgs[1].toLowerCase()}**) is a blacklisted name, you can't use it..`);
				if (msg.gConfig.tags.map(t => t.name).includes(msg.rawArgs[1].toLowerCase())) return msg.reply("H-hey! A tag already exists with that name..");
				const t = msg.gConfig.tags.find(tag => tag.name === msg.rawArgs[1].toLowerCase());
				if (!t) return msg.reply(`I couldn't find a tag with the name "${msg.rawArgs[1].toLowerCase()}"..`);
				const content = msg.rawArgs.slice(2).join(" ");
				if (content.length > 750) return msg.reply("H-hey! Tags have a hard limit of 750 characters..");
				await msg.gConfig.editTag(t.id, "id", content, msg.author.id);

				return msg.reply({
					content: `successfully modified the tag **${msg.rawArgs[1].toLowerCase()}**`,
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.addField("Old Content", t.content, false)
							.addField("New Content", msg.rawArgs.slice(2).join(" "), false)
							.toJSON()
					]
				});
				break;
			}

			case "delete": {
				if (msg.gConfig.tags.size === 0) return msg.reply("th-this server doesn't have any tags to delete..");
				if (msg.args.length === 1) return msg.reply("H-hey! You have to provide the name of a tag to delete..");
				if (["create", "modify", "delete", "list", "help", "get"].includes(msg.rawArgs[1].toLowerCase())) return msg.reply(`H-hey! That name (**${msg.rawArgs[1].toLowerCase()}**) is a blacklisted name, you can't use it..`);
				const t = msg.gConfig.tags.find(tag => tag.name === msg.rawArgs[1].toLowerCase());
				if (!t) return msg.reply(`I couldn't find a tag with the name "${msg.rawArgs[1].toLowerCase()}"..`);
				await msg.gConfig.removeTag(t.id, "id");
				return msg.reply(`successfully deleted the tag **${t.name}**`);
				break;
			}

			case "list": {
				if (msg.gConfig.tags.size === 0) return msg.reply("th-this server doesn't have any tags to list..");
				const page = Number(msg.rawArgs[1]) ?? 1;
				const pages = chunk(msg.gConfig.tags.toArray(), 10);
				if (isNaN(page)) return msg.reply(`H-hey! You can't need to specify a valid page number between **1** and **${pages.length}**..`);
				if (page < 1) return msg.reply("H-hey! You can't supply a page less than one!");
				if (page > pages.length) return msg.reply(`H-hey! You can't supply a page greater than **${pages.length}**!`);
				const tags = [] as Array<Array<string>>;
				for (const tag of pages[page - 1]) {
					const i = pages[page - 1].indexOf(tag);
					const creator = await this.getUser(tag.createdBy);
					const modifier = tag.modifiedBy === null ? null : await this.getUser(tag.modifiedBy);
					tags.push([
						`#${(i + ((page - 1) * 10)) + 1} - \`${tag.name}\``,
						`Created By: ${creator === null ? tag.createdBy : `**${creator.tag}** (<@!${creator.id}>)`}`,
						`Created At: ${BotFunctions.formatDiscordTime(tag.createdAt, "long-datetime", true)}`,
						...(!(tag.modifiedAt && tag.modifiedBy) ? [] : [
							`Modified By: ${modifier === null ? tag.modifiedBy : `**${modifier.tag}** (<@!${modifier.id}>)`}`,
							`Modified At: ${BotFunctions.formatDiscordTime(tag.modifiedAt, "long-datetime", true)}`
						]),
						""
					]);
				}
				return msg.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.setFooter(`UwU | Page ${page}/${pages.length}${page !== pages.length ? ` | ${msg.gConfig.getFormattedPrefix(0)}tags list ${page + 1}` : ""}`)
							.setDescription(tags[0], ...tags.slice(1))
							.toJSON()
					]
				});
				break;
			}

			case "help": {
				return msg.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor(msg.author.tag, msg.author.avatarURL)
							.setTitle("Tag Help")
							.setDescription(
								"(techincal note: **tags** and **tag** refer to the same command)",
								`**Create**: \`${msg.gConfig.getFormattedPrefix(0)}tags create <name> <content>\``,
								`**Modify**: \`${msg.gConfig.getFormattedPrefix(0)}tags modify <name> <newcontent>\``,
								`**Delete**: \`${msg.gConfig.getFormattedPrefix(0)}tags delete <name>\``,
								`**List**: \`${msg.gConfig.getFormattedPrefix(0)}tags list [page]\``,
								`**Help**: \`${msg.gConfig.getFormattedPrefix(0)}tags help\``,
								`**Get**: \`${msg.gConfig.getFormattedPrefix(0)}tag <name>\``
							)
							.toJSON()
					]
				});
				break;
			}

			default: {
				let name = msg.rawArgs[0]?.toLowerCase();
				// this is mainly for slash command support
				if (name === "get") name = msg.rawArgs[1]?.toLowerCase();
				if (!name) return msg.reply(`Y-you have to specify a tag name or sub commend.. Use \`${msg.gConfig.getFormattedPrefix(0)}tag help\` if you need help.`);
				const t = msg.gConfig.tags.find(tag => tag.name === name);
				if (!t) return msg.reply(`I-I couldn't find a tag with the name "${name}".. Use \`${msg.gConfig.getFormattedPrefix(0)}tag help\` if you need help.`);
				// I still want links to be shown and such, so we use a reply, instead of an embed
				// we do a reply instead of a standalone message so there's some blame for where the message is coming from
				// so people can't pull a Dank Memer on us
				return msg.reply(t.content);
			}
		}
	});
