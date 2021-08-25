import config from "../config";
import CommandHandler from "../util/cmd/CommandHandler";
import db from "@db";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import Eris, { CommandInteraction } from "eris";
import util from "util";

export default new ClientEvent("interactionCreate", async function(interaction) {
	if (interaction instanceof Eris.UnknownInteraction) {
		Logger.getLogger("Unknown Interaction").warn("Type:", interaction.type);
		return;
	}
	switch (interaction.type) {
		case Eris.Constants.InteractionTypes.APPLICATION_COMMAND: {
			// @ts-ignore -- waiting on pr updates
			const type = interaction.data.type as 1 | 2 | 3;
			if (interaction.guildID === undefined || interaction.member === undefined) return interaction.createMessage({
				content: "Application Commands cannot be used in direct messages.",
				flags: 64
			});
			if (config.beta) Logger.getLogger("InteractionCreate").debug("new command interaction recieved:", util.inspect(interaction.data, { depth: 3, colors: true }));
			await interaction.acknowledge();
			const userMentions = [] as Array<string>, roleMentions = [] as Array<string>;
			let content = "";
			// eslint-disable-next-line no-inner-declarations
			function formatArg(option: Eris.InteractionDataOptions): string {
				// console.log("o", option);
				if (!("value" in option) && option.type !== Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND) return "";
				switch (option.type) {
					// we only need to reconstruct user & role mentions, because channelMentions
					// are done by Eris
					case Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND: return `${option.name} ${(option.options ?? []).map(o => formatArg(o)).join(" ")}`;
					case Eris.Constants.ApplicationCommandOptionTypes.BOOLEAN: return `<#${option.value ? "true" : "false"}>`;
					case Eris.Constants.ApplicationCommandOptionTypes.USER: userMentions.push(String(option.value)); return `<@!${String(option.value)}>`;
					case Eris.Constants.ApplicationCommandOptionTypes.CHANNEL: return `<#${String(option.value)}>`;
					case Eris.Constants.ApplicationCommandOptionTypes.ROLE: roleMentions.push(String(option.value)); return `<@&${String(option.value)}>`;
					case Eris.Constants.ApplicationCommandOptionTypes.MENTIONABLE: {
						const isUser = (interaction as CommandInteraction).data.resolved?.users?.get(option.value) !== undefined;
						if (isUser) {
							userMentions.push(String(option.value));
							return `<@!${String(option.value)}>`;
						} else {
							roleMentions.push(String(option.value));
							return `<@&${String(option.value)}>`;
						}
					}
					default: return String(option.value);
				}
			}

			const gConfig = await db.getGuild(interaction.guildID);
			switch (type) {
				case Eris.Constants.ApplicationCommandTypes.CHAT_INPUT: {
					content = `${gConfig.getFormattedPrefix()}${(interaction as Eris.CommandInteraction).data.name} ${((interaction as Eris.CommandInteraction).data.options ?? []).map(o => formatArg(o)).join(" ")}`.trim();
					break;
				}

				case Eris.Constants.ApplicationCommandTypes.USER: {
					const target = (interaction as Eris.CommandInteraction).data.target_id as string;
					const cmd = CommandHandler.commands.find(d => !!d.applicationCommands.find(a => a.name === (interaction as Eris.CommandInteraction).data.name));
					if (cmd === undefined) return interaction.createMessage({
						content: "We couldn't figure out how to execute that command.",
						flags: 64
					});
					content = `${gConfig.getFormattedPrefix()}${cmd.triggers[0]} ${target}`.trim();
					break;
				}
			}
			const msg = new Eris.Message({
				// @ts-ignore fake messages don't have ids
				id: null,
				channel_id: interaction.channel.id,
				guild_id: interaction.guildID,
				author: {
					...interaction.member.user.toJSON(),
					public_flags: interaction.member.user.publicFlags
				},
				member: {
					...interaction.member.toJSON(),
					user: {
						...interaction.member.user.toJSON(),
						public_flags: interaction.member.user.publicFlags
					},
					joined_at: interaction.member.joinedAt === null ? undefined : new Date(interaction.member.joinedAt).toISOString(),
					premium_since: interaction.member.premiumSince,
					deaf: interaction.member.voiceState.deaf,
					mute: interaction.member.voiceState.mute,
					pending: interaction.member.pending
				},
				content,
				timestamp: new Date().toISOString(),
				tts: false,
				mention_everyone: false,
				mentions: userMentions.map(id => (interaction as Eris.CommandInteraction).data.resolved?.users?.get(id)).filter(Boolean),
				mention_roles: roleMentions,
				// mention_channels is normally absent
				attachments: [],
				embeds: [],
				reactions: [],
				pinned: false,
				type: Eris.Constants.MessageTypes.DEFAULT,
				flags: 0,
				stickers: [],
				sticker_items: [],
				components: []
			}, this).setInteractionInfo(interaction);

			Logger.getLogger("InteractionCreate").debug(`Emitting message with content "${msg.content}" for slash command interaction by user ${interaction.member.tag} (${interaction.member.id})`);
			this.emit("messageCreate", msg);
			break;
		}

		case Eris.Constants.InteractionTypes.MESSAGE_COMPONENT: {
			Logger.getLogger("ComponentInteraction").info(`Recieved interaction from ${!interaction.member ? "Unknown" : `${interaction.member.tag} (${interaction.member.id})`}, interaction id: "${interaction.data.custom_id}"`);
			break;
		}
	}
});
