import "eris";

declare module "eris" {
	interface Member {
		readonly tag: string;
		readonly realRoles: Array<Role>;
		createMessage(content: MessageContent, file: MessageFile | Array<MessageFile>): Message<PrivateChannel>;
		readonly topRole: Role | null;
		// higher = compared member is higher than current member
		compareToMember(to: Member | string): CompareResult;
		// higher = compared member is higher than current member
		compareToRole(to: Role | string): CompareResult;
	}

	interface User {
		readonly tag: string;
		createMessage(content: MessageContent, file?: MessageFile | Array<MessageFile>): Promise<Message<PrivateChannel>>;
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
		cmdInteracton: CommandInteraction | null;
		private client: Client;
		reply(content: MessageContent, file?: MessageFile | Array<MessageFile>): Promise<Message<T>>;
		replaceContent(content: MessageContent): Promise<Message<T>>;
		setInteractionInfo(interaction:  PingInteraction | CommandInteraction | ComponentInteraction | UnknownInteraction): this;
		getUserFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean): Promise<User | null>;
		getMemberFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean, nick?: boolean): Promise<Member | null>;
		getChannelFromArgs<CH = AnyGuildChannel>(argPosition?: number, mentionPosition?: number, parsed?: boolean, type?: number, threads: true): Promise<CH | null>;
		getChannelFromArgs<CH = AnyGuildChannel>(argPosition?: number, mentionPosition?: number, parsed?: boolean, type?: number, threads?: false): Promise<Exclude<CH, AnyThreadChannel> | null>;
		getRoleFromArgs(argPosition?: number, mentionPosition?: number, parsed?: boolean): Promise<Role | null>;
	}

	type InteractionPayload = Omit<WebhookPayload, "auth" | "avatarURL" | "username" | "wait"> & { flags?: number; };

	interface Client {
		// just for internal use
		private _formatAllowedMentions(allowed: AllowedMentions): unknown;
	}

	interface Channel {
		async awaitMessages<T extends TextableChannel = TextableChannel>(timeout: number, filter: (msg: Message<TextableChannel>) => boolean, limit: number): Promise<Array<Message<T>>>;
		async awaitMessages<T extends TextableChannel = TextableChannel>(timeout: number, filter?: (msg: Message<TextableChannel>) => boolean, limit?: 1): Promise<Message<T> | null>;
	}

	interface GuildChannel {
		readonly typeString: Exclude<keyof Constants["ChannelTypes"], "GUILD_STAGE">;

		async awaitComponentInteractions(timeout: number, filter: (interaction: ComponentInteraction) => boolean, limit: number): Promise<Array<ComponentInteraction>>;
		async awaitComponentInteractions(timeout: number, filter?: (interaction: ComponentInteraction) => boolean, limit?: 1): Promise<ComponentInteraction | null>;

		async awaitComponentInteractionsGeneric(timeout: number, messageId: string, userId: string, limit: number): Promise<Array<ComponentInteraction>>;
		async awaitComponentInteractionsGeneric(timeout: number, messageId: string, userId: string, limit?: 1): Promise<ComponentInteraction | null>;
	}
}
