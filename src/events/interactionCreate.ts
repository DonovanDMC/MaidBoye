import db from "@db";
import ClientEvent from "@util/ClientEvent";
import Logger from "@util/Logger";
import Eris from "eris";
import util from "util";

export default new ClientEvent("interactionCreate", async function(interaction) {
	if (interaction instanceof Eris.UnknownInteraction) {
		Logger.getLogger("Unknown Interaction").warn("Type:", interaction.type);
		return;
	}
	switch (interaction.type) {
		case Eris.Constants.InteractionTypes.SLASH_COMMAND: {
			if (interaction.guildID === undefined || interaction.member === undefined) return interaction.createMessage({
				content: "Slash Commands cannot be used in direct messages.",
				flags: 64
			});
			Logger.getLogger("InteractionCreate").debug("new command interaction recieved:", util.inspect(interaction.data, { depth: 3, colors: true }));
			await interaction.acknowledge();
			const userMentions = [] as Array<string>, roleMentions = [] as Array<string>;
			// eslint-disable-next-line no-inner-declarations
			function formatArg(option: Eris.InteractionDataOptions): string {
				// console.log("o", option);
				if (option.value === undefined && option.type !== Eris.Constants.CommandOptionTypes.SUB_COMMAND) return "";
				switch (option.type) {
					// we only need to reconstruct user & role mentions, because channelMentions
					// are done by Eris
					case Eris.Constants.CommandOptionTypes.SUB_COMMAND: return `${option.name} ${(option.options ?? []).map(o => formatArg(o)).join(" ")}`;
					case Eris.Constants.CommandOptionTypes.BOOLEAN: return `<#${option.value ? "true" : "false"}>`;
					case Eris.Constants.CommandOptionTypes.USER: userMentions.push(String(option.value)); return `<@!${String(option.value)}>`;
					case Eris.Constants.CommandOptionTypes.CHANNEL: return `<#${String(option.value)}>`;
					case Eris.Constants.CommandOptionTypes.ROLE: roleMentions.push(String(option.value)); return `<@&${String(option.value)}>`;
					default: return String(option.value);
				}
			}
			const gConfig = await db.getGuild(interaction.guildID);
			const msg = new Eris.Message({
				// @ts-ignore fake messages don't have ids
				id: null,
				channel_id: interaction.channelID,
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
				content: `${gConfig.getFormattedPrefix()}${(interaction as Eris.CommandInteraction).data.name} ${((interaction as Eris.CommandInteraction).data.options ?? []).map(o => formatArg(o)).join(" ")}`.trim(),
				timestamp: new Date().toISOString(),
				tts: false,
				mention_everyone: false,
				mentions: userMentions.map(id => (interaction as Eris.CommandInteraction).data.resolved?.users?.[id]).filter(Boolean),
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
