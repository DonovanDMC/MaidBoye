import { ChannelTypes, PermissionName, Permissions } from "oceanic.js";

export const moderatorPermissions = [
    "KICK_MEMBERS",
    "BAN_MEMBERS",
    "ADMINISTRATOR",
    "MANAGE_CHANNELS",
    "MANAGE_GUILD",
    "MANAGE_MESSAGES",
    "MENTION_EVERYONE",
    "MUTE_MEMBERS",
    "DEAFEN_MEMBERS",
    "MOVE_MEMBERS",
    "MANAGE_NICKNAMES",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
    "MANAGE_EMOJIS_AND_STICKERS",
    "MANAGE_EVENTS",
    "MANAGE_THREADS",
    "MODERATE_MEMBERS"
] as const;
export type ModeratorPermissions = (typeof moderatorPermissions)[number];

export const AllPermissions = Object.keys(Permissions) as Array<PermissionName>;

export const Colors = {
    bot:        0xA7A4AA,
    gold:       0xFFD700,
    orange:     0xFFA500,
    red:        0xDC143C,
    green:      0x008000,
    white:      0xFFFFFF,
    black:      0x000000,
    brown:      0x8B4513,
    pink:       0xFFC0CB,
    hotPink:    0xFF69B4,
    deepPink:   0xFF1493,
    violet:     0xEE82EE,
    magenta:    0xFF00FF,
    darkViolet: 0x9400D3,
    purple:     0x800080,
    indigo:     0x4B0082,
    maroon:     0x800000,
    cyan:       0x00FFFF,
    teal:       0x008080,
    blue:       0x0000FF,
    yellow:     0xFFD700
    random() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }
};

export const TextableGuildChannels = [
    ChannelTypes.GUILD_TEXT,
    ChannelTypes.GUILD_VOICE,
    ChannelTypes.GUILD_ANNOUNCEMENT
];

export const TextableGuildChannelsWithThreads = [
    ...TextableGuildChannels,
    ChannelTypes.ANNOUNCEMENT_THREAD,
    ChannelTypes.PUBLIC_THREAD,
    ChannelTypes.PRIVATE_THREAD
];

export const lockPermissionsList = [
    Permissions.ADD_REACTIONS,
    Permissions.SEND_MESSAGES,
    Permissions.USE_APPLICATION_COMMANDS,
    Permissions.CREATE_PUBLIC_THREADS,
    Permissions.CREATE_PRIVATE_THREADS,
    Permissions.SEND_MESSAGES_IN_THREADS
];
export const lockPermissions = lockPermissionsList.reduce((a, b) => a | b, 0n);
