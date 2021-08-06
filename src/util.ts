import { APIUser } from "discord-api-types";

export function formatAvatar(user: APIUser, size = 2048): string {
	return `https://cdn.discordapp.com/${user.avatar === null ? `embed/avatars/${Number(user.discriminator) % 5}.png` : `avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=${size}`}`;
}

export interface JSONResponse {
	artists: Array<string>;
	sources: Array<string>;
	width: number;
	height: number;
	url: string;
	type: string;
	name: string;
	size: number;
	shortURL: string;
	reportURL: string;
	ext: string;
}

export async function yiffyRequest(path: string): Promise<JSONResponse> {
	return fetch(`https://v2.yiff.rest${path}`, {
		method: "GET",
		headers: {
			"User-Agent": "MaidBoyeLite/0.0.0 (https://lite.maid.gay)"
		}
	})
	.then(res => res.json() as Promise<{ images: Array<JSONResponse>; }>)
	.then(res => res.images[0]);
}
