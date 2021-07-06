import GuildConfig from "../db/Models/GuildConfig";
import Eris from "eris";

export default class BotFunctions {
	private constructor() {
		throw new TypeError("This class may not be instantiated, use static methods.");
	}

	static messageToOriginal(message: Eris.Message): Record<string, unknown> & { id: string; } {
		return {
			id: message.id,
			channel_id: message.channel.id,
			guild_id: "guild" in message.channel ? message.channel.guild.id : undefined,
			author: {
				...message.author.toJSON(),
				public_flags: message.author.publicFlags
			},
			member: {
				...message.member,
				user: {
					...message.author.toJSON(),
					public_flags: message.author.publicFlags
				},
				joined_at: new Date(message.member?.joinedAt ?? 0).toISOString(),
				premium_since: message.member?.premiumSince,
				deaf: !!message.member?.voiceState.deaf,
				mute: !!message.member?.voiceState.mute,
				pending: message.member?.pending
			},
			content: message.content,
			timestamp: new Date(message.timestamp).toISOString(),
			edited_timestamp: new Date(message.editedTimestamp ?? 0).toISOString(),
			tts: !!message.tts,
			mention_everyone: message.mentionEveryone,
			mentions: message.mentions.map(m => ({
				...m.toJSON(),
				public_flags: m.publicFlags,
				// I don't know what this is supposed to have, as the docs don't make
				// a distinction between normal members and partial members
				member: {
					...message.member,
					user: {
						...message.author.toJSON(),
						public_flags: message.author.publicFlags
					},
					joined_at: new Date(message.member?.joinedAt ?? 0).toISOString(),
					premium_since: message.member?.premiumSince,
					deaf: !!message.member?.voiceState.deaf,
					mute: !!message.member?.voiceState.mute,
					pending: message.member?.pending
				}
			})),
			mention_roles: message.roleMentions,
			mention_channels: message.channelMentions,
			attachments: message.attachments,
			embeds: message.embeds,
			reactions: Object.entries(message.reactions).map(([k, v]) => ({
				count: v.count,
				me: v.me,
				emoji: k.indexOf(":") !== -1 ? {
					id: null,
					name: k
				} : {
					id: k.split(":")[0],
					name: k.split(":")[1]
				}
			})),
			pinned: !!message.pinned,
			webhook_id: message.webhookID,
			type: message.type,
			activity: message.activity,
			application: message.application,
			application_id: message.application?.id,
			message_reference: message.messageReference === null ? undefined : {
				message_id: message.messageReference.messageID,
				channel_id: message.messageReference.channelID,
				guild_id: message.messageReference.guildID
			},
			flags: message.flags,
			stickers: message.stickers,
			referenced_message: message.referencedMessage === undefined ? undefined : message.referencedMessage === null ? null : this.messageToOriginal(message.referencedMessage),
			interaction: null,
			components: message.components
		};
	}

	static formatPrefix(p: GuildConfig | GuildConfig["prefix"] | GuildConfig["prefix"][number]) {
		if (p instanceof GuildConfig) p = p.prefix[0];
		if (Array.isArray(p)) p = p[0];
		return `${p.value}${p.space ? " " : ""}`;
	}

	static getUserFlags(user: Eris.User) {
		const removedFlags = [
			"NONE"
		] as const;
		return Object.entries(Eris.Constants.UserFlags).filter(([f]) => !removedFlags.includes(f as (typeof removedFlags)[number])).map(([f, v]) => ({
			[f]: ((user.publicFlags ?? 0) & v) === v
		})).reduce((a, b) => ({ ...a, ...b }), {}) as {
			[K in Exclude<keyof typeof Eris.Constants.UserFlags, (typeof removedFlags)[number]>]: boolean;
		};
	}

	static getUserFlagsArray(user: Eris.User) {
		return Object.entries(this.getUserFlags(user)).filter(([, b]) => b === true).map(([a]) => a) as Array<keyof ReturnType<typeof BotFunctions["getUserFlags"]>>;
	}

	static getMessageFlags(msg: Eris.Message) {
		return Object.entries(Eris.Constants.MessageFlags).map(([f, v]) => ({
			[f]: ((msg.flags ?? 0) & v) === v
		})).reduce((a, b) => ({ ...a, ...b }), {}) as {
			[K in keyof typeof Eris.Constants.MessageFlags]: boolean;
		};
	}

	static formatDiscordTime(time: number, flag: "short-time" | "long-time" | "short-date" | "long-date" | "short-datetime" | "long-datetime" | "relative" = "short-datetime") {
		return `<t:${time}:${
			flag === "short-time" ? "t" :
				flag === "long-time" ? "T" :
					flag === "short-date" ? "d" :
						flag === "long-date" ? "D" :
							flag === "short-datetime" ? "f" :
								flag === "long-datetime" ? "F" :
									flag === "relative" ? "R" :
										"f"}>`;
	}
}
