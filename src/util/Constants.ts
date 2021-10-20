import type Eris from "eris";

export const Colors = {
	bot: 0xA7A4AA,
	get random() { return Math.floor(Math.random() * 0xFFFFFF); },
	gold: 0xFFD700,
	orange: 0xFFA500,
	red: 0xDC143C,
	green: 0x008000,
	white: 0xFFFFFF,
	black: 0x000000,
	brown: 0x8B4513,
	pink: 0xFFC0CB,
	hotPink: 0xFF69B4,
	deepPink: 0xFF1493,
	violet: 0xEE82EE,
	magenta: 0xFF00FF,
	darkViolet: 0x9400D3,
	purple: 0x800080,
	indigo: 0x4B0082,
	maroon: 0x800000,
	cyan: 0x00FFFF,
	teal: 0x008080,
	blue: 0x0000FF
};

export const GameType = {
	PLAYING: 0,
	STREAMING: 1,
	LISTENING: 2,
	WATCHING: 3,
	CUSTOM: 4,
	COMPETING: 5
} as const;

export const deprecatedPermissions = [
	"viewAuditLogs",
	"stream",
	"readMessages",
	"externalEmojis",
	"manageEmojis",
	"useSlashCommands"
] as const;
export type DeprecatedPermissions = (typeof deprecatedPermissions)[number];

export const fakePermissions = [
	"allGuild",
	"allText",
	"allVoice",
	"all"
] as const;
export type FakePermissions = (typeof fakePermissions)[number];

export type Permissions = Exclude<keyof typeof Eris["Constants"]["Permissions"], DeprecatedPermissions | FakePermissions>;
export type PermissionsWithDeprecated = Exclude<keyof typeof Eris["Constants"]["Permissions"], FakePermissions>;
export type AllPermissions = keyof typeof Eris["Constants"]["Permissions"];
