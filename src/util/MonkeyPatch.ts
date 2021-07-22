// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./@types/Eris.d.ts" />
/* eslint-disable import/order */
import path from "path";
import moduleAlias from "module-alias";
const d = path.resolve(`${__dirname}/../../`);
moduleAlias.addAliases({
	"@root": d,
	"@config": `${d}/src/config`,
	"@util": `${d}/src/util`,
	"@cmd": `${d}/src/util/cmd`,
	"@db": `${d}/src/db`,
	"@MaidBoye": `${d}/src/main`
});
import MessageCollector from "./MessageCollector";
import ComponentInteractionCollector, { InteractionWithData } from "./ComponentInteractionCollector";
import Eris from "eris";
import sauce from "source-map-support";
import { APIMessageComponentInteractionData } from "discord-api-types";
import MaidBoye from "@MaidBoye";
sauce.install({ hookRequire: true });

Object.defineProperties(Eris.User.prototype, {
	tag: {
		get(this: Eris.User) { return `${this.username}#${this.discriminator}`; }
	},
	createMessage: {
		value(this: Eris.User, content: Eris.MessageContent, file: Eris.MessageFile | Array<Eris.MessageFile>) {
			return this.getDMChannel().then(ch => ch.createMessage(content, file));
		}
	}
});

Object.defineProperties(Eris.Member.prototype, {
	tag: {
		get(this: Eris.Member) { return this.user.tag; }
	},
	realRoles: {
		get(this: Eris.Member) { return this.roles.map(r => this.guild.roles.get(r)); }
	},
	topRole: {
		get(this: Eris.Member) { return this.realRoles.sort((a,b) => b.position - a.position)[0] ?? null; }
	},
	// higher = compared member is higher than current member
	compareToMember: {
		value(this: Eris.Member, to: Eris.Member | string) {
			if (!(to instanceof Eris.Member)) to = this.guild.members.get(to)!;
			if (!to) return "invalid";
			const a = this.topRole?.position ?? -1;
			const b = to.topRole?.position ?? -1;
			if (a < b) return "higher";
			else if (a > b) return "lower";
			else if (a === b) return "same";
			else return "unknown";
		}
	},
	// higher = compared role is higher than current member
	compareToRole: {
		value(this: Eris.Member, to: Eris.Role | string) {
			if (!(to instanceof Eris.Role)) to = this.guild.roles.get(to)!;
			if (!to) return "invalid";
			const a = this.topRole?.position ?? -1;
			if (a < to.position) return "higher";
			else if (a > to.position) return "lower";
			else if (a === to.position) return "same";
			else return "unknown";
		}
	},
	createMessage: {
		get(this: Eris.Member) { return this.user.createMessage.bind(this.user); }
	}
});

Object.defineProperties(Eris.Guild.prototype, {
	me: {
		get(this: Eris.Guild) { return this.members.get(this._client.user.id); }
	},
	owner: {
		get(this: Eris.Guild) { return this.members.get(this.ownerID); }
	}
});

Object.defineProperties(Eris.Role.prototype, {
	compareToRole: {
		value(this: Eris.Role, to: Eris.Role | string) {
			if (!(to instanceof Eris.Role)) to = this.guild.roles.get(to)!;
			if (!to) return "invalid";
			if (this.position > to.position) return "lower";
			else if (this.position < to.position) return "higher";
			else if (this.position === to.position) return "same";
			else return "unknown";
		}
	},
	compareToMember: {
		value(this: Eris.Role, to: Eris.Member | string) {
			if (!(to instanceof Eris.Member)) to = this.guild.members.get(to)!;
			if (!to) return "invalid";
			const pos = (to.topRole?.position ?? -1);
			if (this.position > pos) return "lower";
			else if (this.position < pos) return "higher";
			else if (this.position === pos) return "same";
			else return "unknown";
		}
	}
});

const idRegex = /^[\d]{15,21}$/;
Object.defineProperties(Eris.Message.prototype, {
	interaction: {
		value: false,
		writable: true,
		enumerable: true
	},
	interactionId: {
		value: null,
		writable: true,
		enumerable: true
	},
	interactionToken: {
		value: null,
		writable: true,
		enumerable: true
	},
	reply: {
		value(this: Eris.Message, content: Eris.MessageContent, file: Eris.MessageFile | Array<Eris.MessageFile>) {
			if (typeof content === "string") content = { content };
			if (this.isInteraction === true && (this.interactionId !== null && this.interactionToken !== null)) {
				if (this.firstReply === true) return this.client.createFollowupMessage(this.client.user.id, this.interactionToken, content);
				else {
					this.firstReply = true;
					return this.client.createInteractionResponse(this.interactionId, this.interactionToken, 5, content);
				}
			} else return this.channel.createMessage({
				...content,
				messageReference: {
					messageID: this.id,
					guildID: this.guildID,
					channelID: this.channel.id,
					failIfNotExists: false
				}
			}, file);
		}
	},
	setInteractionInfo: {
		value(this: Eris.Message, isInteraction: boolean, interactionId: string | null, interactionToken: string | null) {
			this.isInteraction = isInteraction;
			this.interactionId = interactionId;
			this.interactionToken = interactionToken;
		}
	},
	getUserFromArgs: {
		async value(this: Eris.Message, argPosition = 0, mentionPosition = 0, parsed = true) {
			if (!("guild" in this.channel)) throw new Error("Missing 'guild' property on channel in Message#getUserFromArgs");
			let arg = (this[parsed ? "args" : "rawArgs"])?.[argPosition];
			// if args are undefined, we are probably in a normal message
			if (arg === undefined) arg = this.content.split(" ")?.[argPosition];
			if (arg === undefined) return null;
			let u: Eris.User | null = null;
			if (idRegex.test(arg)) {
				u = this.client.users.get(arg) ?? null;
				if (u === null) {
					u = await this.client.getRESTUser(arg).catch(() => null);
					if (u !== null) return this.client.users.add(u, undefined, true);
				} else return u;
			}
			const byUsername = this.client.users.find(user => user.username.toLowerCase() === arg.toLowerCase()) ?? null;
			const byTag = this.client.users.find(user => user.tag.toLowerCase() === arg.toLowerCase()) ?? null;

			if (byUsername === null && byTag === null) return this.mentions[mentionPosition] ?? null;
			else return byUsername || byTag;
		}
	},
	getMemberFromArgs: {
		async value(this: Eris.Message & { client: MaidBoye; }, argPosition = 0, mentionPosition = 0, parsed = true, nick = true) {
			if (!("guild" in this.channel)) throw new Error("Missing 'guild' property on channel in Message#getMemberFromArgs");
			let arg = (this[parsed ? "args" : "rawArgs"])?.[argPosition];
			// if args are undefined, we are probably in a normal message
			if (arg === undefined) arg = this.content.split(" ")?.[argPosition];
			let m: Eris.Member | null = null;
			if (idRegex.test(arg)) {
				m = await this.client.getMember(this.channel.guild.id, arg);
				if (m) return m;
			}
			const byUsername = this.channel.guild.members.find(member => member.username.toLowerCase() === arg.toLowerCase()) ?? null;
			const byNick = nick ? this.channel.guild.members.find(member => member.nick !== null && member.nick.toLowerCase() === arg.toLowerCase()) ?? null : null;
			const byTag = this.channel.guild.members.find(member => member.tag.toLowerCase() === arg.toLowerCase()) ?? null;

			if (byUsername === null && byNick === null && byTag === null) return this.channel.guild.members.get(this.mentions[mentionPosition]?.id) ?? null;
			else return byUsername || byNick || byTag;
		}
	},
	getChannelFromArgs: {
		async value(this: Eris.Message, argPosition = 0, mentionPosition = 0, parsed = true, type?: number, threads = false) {
			if (!("guild" in this.channel)) throw new Error("Missing 'guild' property on channel in Message#getChannelFromArgs");
			let arg = (this[parsed ? "args" : "rawArgs"])?.[argPosition];
			// if args are undefined, we are probably in a normal message
			if (arg === undefined) arg = this.content.split(" ")?.[argPosition];
			let c: Eris.AnyGuildChannel | null = null;
			if (idRegex.test(arg)) {
				c = this.channel.guild.channels.get(arg) ?? null;
				if (c !== null && (!type || c.type === type)) return c;
			}

			// support searching for threads
			if (threads === true) {
				const byName = this.channel.guild.threads.find(thread => thread.name.toLowerCase() === arg.toLowerCase() && (!type || thread.type === type)) ?? null;

				if (byName === null) {
					const byMention = this.channel.guild.threads.get(this.channelMentions[mentionPosition]) ?? null;
					if (byMention !== null && (!type || byMention.type === type)) return byMention;
				} else return byName;
			}
			const byName = this.channel.guild.channels.find(channel => channel.name.toLowerCase() === arg.toLowerCase() && (!type || channel.type === type)) ?? null;

			if (byName === null) {
				const byMention = this.channel.guild.channels.get(this.channelMentions[mentionPosition]) ?? null;
				if (byMention !== null && (!type || byMention.type === type)) return byMention;
				else return null;
			} else return byName;
		}
	},
	getRoleFromArgs: {
		async value(this: Eris.Message, argPosition = 0, mentionPosition = 0, parsed = true) {
			if (!("guild" in this.channel)) throw new Error("Missing 'guild' property on channel in Message#getRoleFromArgs");
			let arg = (this[parsed ? "args" : "rawArgs"])?.[argPosition];
			// if args are undefined, we are probably in a normal message
			if (arg === undefined) arg = this.content.split(" ")?.[argPosition];
			let r: Eris.Role | null = null;
			if (idRegex.test(arg)) {
				r = this.channel.guild.roles.get(arg) ?? null;
				if (r !== null) return r;
			}
			const byName = this.channel.guild.roles.find(role => role.name.toLowerCase() === arg.toLowerCase()) ?? null;

			if (byName === null) return this.channel.guild.roles.get(this.roleMentions[mentionPosition]) ?? null;
			else return byName;
		}
	}
});

Object.defineProperties(Eris.Client.prototype, {
	createInteractionResponse: {
		async value(this: Eris.Client, id: string, token: string, type: Eris.InteractionCallbackType, content?: Eris.InteractionPayload) {
			if (content && (!content.content && !content.file && !content.embeds)) return Promise.reject(new Error("No content, file, or embeds"));
			return this.requestHandler.request("POST", `/interactions/${id}/${token}/callback`, true, {
				type,
				data: content === undefined ? {} : {
					content: content.content,
					embeds: content.embeds,
					allowed_mentions: this._formatAllowedMentions(content.allowedMentions ?? {}),
					components: content.components
				}
			}, content && content.file ? Array.isArray(content.file) ? content.file[0] : content.file : undefined, "/interactions/:id/:token/callback")
				.then(v => new Eris.Message(v as Eris.BaseData, this));
		}
	},
	getOriginalInteractionResponse: {
		value(this: Eris.Client, applicationId: string, token: string) {
			return this.requestHandler.request("GET", `/webhooks/${applicationId}/${token}/messages/@original`, true, undefined, undefined, "/webhooks/:applicationId/:token/messages/@original").then((response) => new Eris.Message(response as Eris.BaseData, this));
		}
	},
	editOriginalInteractionResponse: {
		value(this: Eris.Client, applicationId: string, token: string, content: Eris.InteractionPayload) {
			return this.editFollowupMessage(applicationId, token, "@original", content);
		}
	},
	deleteOriginalInteractionResponse: {
		value(this: Eris.Client, applicationId: string, token: string) {
			return this.deleteFollowupMessage(applicationId, token, "@original");
		}
	},
	createFollowupMessage: {
		async value(this: Eris.Client, applicationId: string, token: string, content: Eris.InteractionPayload) {
			if (content && (!content.content && !content.file && !content.embeds)) return Promise.reject(new Error("No content, file, or embeds"));
			return this.requestHandler.request("POST", `/webhooks/${applicationId}/${token}`, true, {
				content: content.content,
				embeds: content.embeds,
				allowed_mentions: this._formatAllowedMentions(content.allowedMentions ?? {}),
				components: content.components,
				flags: content.flags
			}, Array.isArray(content.file) ? content.file[0] : content.file, "/webhooks/:applicationId/:token")
				.then(v => new Eris.Message(v as Eris.BaseData, this));
		}
	},
	editFollowupMessage: {
		async value(this: Eris.Client, applicationId: string, token: string, messageId: string, content: Eris.InteractionPayload) {
			if (!content.content && !content.file && !content.embeds) return Promise.reject(new Error("No content, file, or embeds"));
			return this.requestHandler.request("PATCH", `/webhooks/${applicationId}/${token}/messages/${messageId}`, true, {
				content: content.content,
				embeds: content.embeds,
				allowed_mentions: this._formatAllowedMentions(content.allowedMentions ?? {}),
				components: content.components,
				flags: content.flags
			}, Array.isArray(content.file) ? content.file[0] : content.file, `/webhooks/:applicationId/:token/messages/${messageId === "@original" ? "@original" : ":messageId"}`)
				.then(v => new Eris.Message(v as Eris.BaseData, this));
		}
	},
	deleteFollowupMessage: {
		async value(this: Eris.Client, applicationId: string, token: string, id: string) {
			return this.requestHandler.request("DELETE", `/webhooks/${applicationId}/${token}/messages/${id}`, true, undefined, undefined, `/webhooks/:applicationId/:token/messages/${id === "@original" ? "@original" : ":id"}`);
		}
	}
});

Object.defineProperties(Eris.GuildChannel.prototype, {
	awaitMessages: {
		async value(this: Eris.GuildTextableChannel, timeout: number, filter: (msg: Eris.Message<Eris.TextableChannel>) => boolean = (() => true), limit?: number) {
			return MessageCollector.awaitMessages(this.id, timeout, filter, limit as 1);
		}
	},
	awaitComponentInteractions: {
		async value(this: Eris.GuildTextableChannel, timeout: number, filter: (interaction: InteractionWithData<APIMessageComponentInteractionData>) => boolean = (() => true), limit?: number) {
			return ComponentInteractionCollector.awaitInteractions(this.id, timeout, filter, limit as 1);
		}
	},
	typeString: {
		get(this: Eris.GuildTextableChannel) {
			return Object.entries(Eris.Constants.ChannelTypes).find(([, n]) => this.type === n)![0];
		}
	}
});


Object.defineProperty(Eris, "InteractionCallbackType", {
	value: {
		PONG: 1,
		CHANNEL_MESSAGE_WITH_SOURCE: 4,
		DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
		DEFERRED_UPDATE_MESSAGE: 6,
		UPDATE_MESSAGE: 7
	}
});
