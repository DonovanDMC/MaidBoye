import { APIUser } from "discord-api-types";

export function formatAvatar(user: APIUser, size: number): string {
	return `https://cdn.discordapp.com/${user.avatar === null ? `embed/avatars/${Number(user.discriminator) % 5}.png` : `avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=${size}`}`;
}
