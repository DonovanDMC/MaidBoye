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

	interface GuildChannel {
		readonly typeString: keyof Constants["ChannelTypes"];

		async awaitMessages<T extends TextableChannel = Exclude<GuildTextableChannel, AnyThreadChannel>>(timeout: number, filter: (msg: Message<TextableChannel>) => boolean, limit: number): Promise<Array<Message<T>>>;
		async awaitMessages<T extends TextableChannel = Exclude<GuildTextableChannel, AnyThreadChannel>>(timeout: number, filter?: (msg: Message<TextableChannel>) => boolean, limit?: 1): Promise<Message<T> | null>;

		async awaitComponentInteractions(timeout: number, filter: (interaction: ComponentInteraction) => boolean, limit: number): Promise<Array<ComponentInteraction>>;
		async awaitComponentInteractions(timeout: number, filter?: (interaction: ComponentInteraction) => boolean, limit?: 1): Promise<ComponentInteraction | null>;
	}

	type GuildTextableChannelWithoutThreads = Exclude<GuildTextableChannel, AnyThreadChannel>;
}
