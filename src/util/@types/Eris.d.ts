import "eris";

declare module "eris" {
	interface Member {
		readonly tag: string;
		readonly realRoles: Array<Role>;
		createMessage(content: MessageContent, file: MessageFile | Array<MessageFile>): Message<PrivateChannel>;
		readonly topRole: Role | null;
		compareToMember(to: Member | string): CompareResult;
		compareToRole(to: Role | string): CompareResult;
	}

	interface User {
		readonly tag: string;
		createMessage(content: MessageContent, file: MessageFile | Array<MessageFile>): Message<PrivateChannel>;
	}

	interface Guild {
		// just for internal use
		private _client: Client;
		me: Member;
		owner: Member;
	}

	type CompareResult = "higher" | "lower" | "same" | "invalid" | "unknown";

	interface Role {
		compareToRole(to: Role | string): CompareResult;
		compareToMember(to: Member | string): CompareResult;
	}

	interface Message<T = GuildTextableChannel> {
		args: Array<string>;
		rawArgs: Array<string>;
		isInteraction: boolean;
		private interactionId: string | null;
		private interactionToken: string | null;
		private firstReply: boolean;
		private client: Client;
		reply(content: MessageContent, file?: MessageFile | Array<MessageFile>): Promise<Message<T>>;
		setInteractionInfo(interaction: boolean, interactionId: string | null, interactionToken: string | null): void;
		getUserFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean): Promise<User | null>;
		getMemberFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean, nick?: boolean): Promise<Member | null>;
		getChannelFromArgs<CH = AnyGuildChannel>(argPosition?: number, mentionPosition?: number, parsed?: boolean, type?: number, threads: true): Promise<CH | null>;
		getChannelFromArgs<CH = AnyGuildChannel>(argPosition?: number, mentionPosition?: number, parsed?: boolean, type?: number, threads?: false): Promise<Exclude<CH, AnyThreadChannel> | null>;
		getRoleFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean): Promise<Role | null>;
	}

	type InteractionPayload = Omit<WebhookPayload, "auth" | "avatarURL" | "username" | "wait"> & { flags?: number; };
	type InteractionCallbackType = 1 | 4 | 5 | 6 | 7;

	interface Client {
		createInteractionResponse(id: string, token: string, type: InteractionCallbackType, content?: InteractionPayload): Promise<void>;
		getOriginalInteractionResponse(applicationId: string, token: string): Promise<Message<GuildTextableChannel>>;
		editOriginalInteractionResponse(applicationId: string, token: string, content: InteractionPayload): Promise<void>;
		deleteOriginalInteractionResponse(applicationId: string, token: string): Promise<void>;

		createFollowupMessage(applicationId: string, token: string, content: InteractionPayload): Promise<void>;
		editFollowupMessage(applicationId: string, token: string, messageId: string, content: InteractionPayload): Promise<void>;
		deleteFollowupMessage(applicationId: string, token: string, messageId: string): Promise<void>;
		// just for internal use
		private _formatAllowedMentions(allowed: AllowedMentions): unknown;
	}
}
