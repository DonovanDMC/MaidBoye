/* eslint-disable @typescript-eslint/unified-signatures */
import MaidBoye from "../main";
import {
	AnyChannel, AnyGuildChannel, AnyVoiceChannel, Call,
	Emoji, FriendSuggestionReasons, GroupChannel, Guild,
	GuildTextableChannel, Invite, Member, MemberPartial,
	Message, OldCall, OldGroupChannel, OldGuild,
	OldGuildChannel, OldGuildTextChannel, OldGuildVoiceChannel, OldMember,
	OldMessage, OldRole, OldVoiceState, PartialEmoji,
	PartialUser, PossiblyUncachedGuild, PossiblyUncachedMessage, PossiblyUncachedTextableChannel,
	Presence, PrivateChannel, RawPacket, RawRESTRequest,
	Relationship, Role, TextableChannel, UnavailableGuild,
	Uncached, User, WebhookData
} from "eris";

// taken from https://github.com/abalabahaha/eris/blob/dev/index.d.ts
// Commit: ec777a1acb8c57bf95a2c42f7fa740f7272b49e5
export default class ClientEvent {
	name: string;
	// eslint-disable-next-line @typescript-eslint/ban-types
	listener: Function;
	constructor(event: "ready" | "disconnect", listener: (this: MaidBoye) => void);
	constructor(event: "callCreate" | "callRing" | "callDelete", listener: (this: MaidBoye, call: Call) => void);
	constructor(event: "callUpdate", listener: (this: MaidBoye, call: Call, oldCall: OldCall) => void);
	constructor(event: "channelCreate" | "channelDelete", listener: (this: MaidBoye, channel: AnyChannel) => void);
	constructor(event: "channelPinUpdate", listener: (this: MaidBoye, channel: TextableChannel, timestamp: number, oldTimestamp: number) => void);
	constructor(event: "channelRecipientAdd" | "channelRecipientRemove", listener: (this: MaidBoye, channel: GroupChannel, user: User) => void);
	constructor(event: "channelUpdate", listener: (this: MaidBoye, channel: AnyGuildChannel, oldChannel: OldGuildChannel | OldGuildTextChannel | OldGuildVoiceChannel) => void);
	constructor(event: "channelUpdate", listener: (this: MaidBoye, channel: GroupChannel, oldChannel: OldGroupChannel) => void);
	constructor(event: "connect" | "shardPreReady", listener: (this: MaidBoye, id: number) => void);
	constructor(event: "error", listener: (this: MaidBoye, err: Error, id: number) => void);
	constructor(event: "friendSuggestionCreate", listener: (this: MaidBoye, user: User, reasons: FriendSuggestionReasons) => void);
	constructor(event: "friendSuggestionDelete", listener: (this: MaidBoye, user: User) => void);
	constructor(event: "guildBanAdd" | "guildBanRemove", listener: (this: MaidBoye, guild: Guild, user: User) => void);
	constructor(event: "guildAvailable" | "guildCreate", listener: (this: MaidBoye, guild: Guild) => void);
	constructor(event: "guildDelete", listener: (this: MaidBoye, guild: PossiblyUncachedGuild) => void);
	constructor(event: "guildEmojisUpdate", listener: (this: MaidBoye, guild: PossiblyUncachedGuild, emojis: Array<Emoji>, oldEmojis: Array<Emoji> | null) => void);
	constructor(event: "guildMemberAdd", listener: (this: MaidBoye, guild: Guild, member: Member) => void);
	constructor(event: "guildMemberChunk", listener: (this: MaidBoye, guild: Guild, members: Array<Member>) => void);
	constructor(event: "guildMemberRemove", listener: (this: MaidBoye, guild: Guild, member: Member | MemberPartial) => void);
	constructor(event: "guildMemberUpdate", listener: (this: MaidBoye, guild: Guild, member: Member, oldMember: OldMember | null) => void);
	constructor(event: "guildRoleCreate" | "guildRoleDelete", listener: (this: MaidBoye, guild: Guild, role: Role) => void);
	constructor(event: "guildRoleUpdate", listener: (this: MaidBoye, guild: Guild, role: Role, oldRole: OldRole) => void);
	constructor(event: "guildUnavailable" | "unavailableGuildCreate", listener: (this: MaidBoye, guild: UnavailableGuild) => void);
	constructor(event: "guildUpdate", listener: (this: MaidBoye, guild: Guild, oldGuild: OldGuild) => void);
	constructor(event: "hello", listener: (this: MaidBoye, trace: Array<string>, id: number) => void);
	constructor(event: "inviteCreate" | "inviteDelete", listener: (this: MaidBoye, guild: Guild, invite: Invite) => void);
	constructor(event: "messageCreate", listener: (this: MaidBoye, message: Message<PossiblyUncachedTextableChannel>) => void);
	constructor(event: "messageDelete" | "messageReactionRemoveAll", listener: (this: MaidBoye, message: PossiblyUncachedMessage) => void);
	constructor(event: "messageReactionRemoveEmoji", listener: (this: MaidBoye, message: PossiblyUncachedMessage, emoji: PartialEmoji) => void);
	constructor(event: "messageDeleteBulk", listener: (this: MaidBoye, messages: Array<PossiblyUncachedMessage>) => void);
	constructor(event: "messageReactionAdd", listener: (this: MaidBoye, message: PossiblyUncachedMessage, emoji: PartialEmoji, reactor: Member | Uncached) => void);
	constructor(event: "messageReactionRemove", listener: (this: MaidBoye, message: PossiblyUncachedMessage, emoji: PartialEmoji, userID: string) => void);
	constructor(event: "messageUpdate", listener: (this: MaidBoye, message: Message<PossiblyUncachedTextableChannel>, oldMessage: OldMessage | null) => void);
	constructor(event: "presenceUpdate", listener: (this: MaidBoye, other: Member | Relationship, oldPresence: Presence | null) => void);
	constructor(event: "rawREST", listener: (this: MaidBoye, request: RawRESTRequest) => void);
	constructor(event: "rawWS" | "unknown", listener: (this: MaidBoye, packet: RawPacket, id: number) => void);
	constructor(event: "relationshipAdd" | "relationshipRemove", listener: (this: MaidBoye, relationship: Relationship) => void);
	constructor(event: "relationshipUpdate", listener: (this: MaidBoye, relationship: Relationship, oldRelationship: { type: number; }) => void);
	constructor(event: "typingStart", listener: (this: MaidBoye, channel: GuildTextableChannel| Uncached, user: User | Uncached, member: Member) => void);
	constructor(event: "typingStart", listener: (this: MaidBoye, channel: PrivateChannel | Uncached, user: User | Uncached, member: null) => void);
	constructor(event: "userUpdate", listener: (this: MaidBoye, user: User, oldUser: PartialUser | null) => void);
	constructor(event: "voiceChannelJoin" | "voiceChannelLeave", listener: (this: MaidBoye, member: Member, channel: AnyVoiceChannel) => void);
	constructor(event: "voiceChannelSwitch", listener: (this: MaidBoye, member: Member, newChannel: AnyVoiceChannel, oldChannel: AnyVoiceChannel) => void);
	constructor(event: "voiceStateUpdate", listener: (this: MaidBoye, member: Member, oldState: OldVoiceState) => void);
	constructor(event: "warn" | "debug", listener: (this: MaidBoye, message: string, id: number) => void);
	constructor(event: "webhooksUpdate", listener: (this: MaidBoye, data: WebhookData) => void);
	constructor(event: "shardReady" | "shardResume", listener: (this: MaidBoye, id: number) => void);
	constructor(event: "shardDisconnect", listener: (this: MaidBoye, err: Error | undefined, id: number) => void);
	// eslint-disable-next-line @typescript-eslint/ban-types
	constructor(event: string, listener: Function) {
		this.name = event;
		this.listener = listener;
	}
}
