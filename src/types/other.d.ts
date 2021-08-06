import { APIInteractionResponseChannelMessageWithSource, APIInteractionResponseDeferredMessageUpdate, APIInteractionResponseUpdateMessage } from "discord-api-types";

declare namespace Other {
	type SlashCommandResponseFunction = (response: APIInteractionResponseChannelMessageWithSource) => Response;
	type ComponentResponseFunction = (response: APIInteractionResponseUpdateMessage | APIInteractionResponseDeferredMessageUpdate | APIInteractionResponseChannelMessageWithSource) => Response;
	type RespondFunction<T extends "command" | "component" = never> =
	T extends "command" ? SlashCommandResponseFunction :
		T extends "component" ? ComponentResponseFunction :
		SlashCommandResponseFunction | ComponentResponseFunction

}
export = Other;
