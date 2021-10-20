import { beta } from "../config";
import CommandHandler from "../util/cmd/CommandHandler";
import type { ComponentInteractionType } from "../events/components/main";
import ComponentInteractionHandler from "../events/components/main";
import db from "@db";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import type { CommandInteraction } from "eris";
import Eris from "eris";
import Settings, { slashify } from "@util/Settings";
import util from "util";

export default new ClientEvent("interactionCreate", async function(interaction) {
	if (interaction instanceof Eris.UnknownInteraction) {
		Logger.getLogger("Unknown Interaction").warn("Type:", interaction.type);
		return;
	}

	switch (interaction.type) {
		case Eris.Constants.InteractionTypes.APPLICATION_COMMAND: {
			if (interaction.guildID === undefined || interaction.member === undefined) return interaction.createMessage({
				content: "Application Commands cannot be used in direct messages.",
				flags: 64
			});
			if (beta) Logger.getLogger("InteractionCreate").debug("new command interaction recieved:", util.inspect(interaction.data, { depth: 3, colors: true }));
			if (interaction.data.name === "settings") {
				if (interaction.data.options && interaction.data.options.length > 0) {
					const setting = Settings.find(s => !!interaction.data.options!.find(o => slashify(s.name) === o.name));
					if (setting) {
						await interaction.acknowledge();
						void setting.execSlash(interaction);
					}
					return;
				}
			}
			await interaction.acknowledge();
			const userMentions = [] as Array<string>, roleMentions = [] as Array<string>;
			let content = "";
			// eslint-disable-next-line no-inner-declarations
			function formatArg(option: Eris.InteractionDataOptions): string {
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
					default: {
						if ((interaction as Eris.CommandInteraction).data.name === "suggest") {
							if (option.name === "title") return `--title="${String(option.value)}"`;
							else if (option.name === "description") return `--description="${String(option.value)}"`;
							else return String(option.value);
						}
						return String(option.value);
					}
				}
			}

			const gConfig = await db.getGuild(interaction.guildID);
			switch (interaction.data.type) {
				case Eris.Constants.ApplicationCommandTypes.CHAT_INPUT: {
					content = `${gConfig.getFormattedPrefix()}${interaction.data.name} ${(interaction.data.options ?? []).map(o => formatArg(o)).join(" ")}`.trim();
					break;
				}

				case Eris.Constants.ApplicationCommandTypes.USER: {
					const target = (interaction).data.target_id as string;
					const cmd = CommandHandler.commands.find(d => !!d.applicationCommands.find(a => a.name === (interaction).data.name));
					if (cmd === undefined) return interaction.createMessage({
						content: "We couldn't figure out how to execute that command.",
						flags: 64
					});
					content = `${gConfig.getFormattedPrefix()}${cmd.triggers[0]} ${target}`.trim();
					break;
				}
			}
			const msg = new Eris.Message({
				// @ts-expect-error fake messages don't have ids
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
				mentions: userMentions.map(id => (interaction).data.resolved?.users?.get(id)).filter(Boolean),
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
			const user = interaction.data.custom_id.split(".").slice(-1)[0];
			if (interaction.member && user !== interaction.member.id) return interaction.createMessage({
				content: `H-hey <@!${interaction.member.id}>! That isn't your button to click..`,
				flags: Eris.Constants.MessageFlags.EPHEMERAL
			});
			if (!("member" in interaction) || interaction.member === undefined) return;
			void ComponentInteractionHandler.handle(interaction as ComponentInteractionType, this);
			break;
		}
	}
});
