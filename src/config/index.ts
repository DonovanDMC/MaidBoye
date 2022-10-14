/* eslint-disable @typescript-eslint/member-ordering */
import betaClient from "./private/client.beta.json" assert { type: "json" };
import prodClient from "./private/client.prod.json" assert { type: "json" };
import PrivateConfig from "./private/private.js";
import emojis from "./json/emojis.json" assert { type: "json" };
import pkg from "../../package.json" assert { type: "json" };
import { ClientOptions, Permissions, UpdatePresenceOptions, ActivityTypes } from "oceanic.js";
import { readFile } from "node:fs/promises";

const host = await readFile("/data/hostname", "utf8").then(val => val.trim(), () => null);
export default class Config extends PrivateConfig {
    static get isDevelopment() {
        return host !== this.prodServerHost;
    }

    static override get prodServerHost() {
        return super.prodServerHost;
    }

    static get developers() {
        return ["242843345402069002"];
    }

    static get isDocker() {
        return process.env.DOCKER === "1";
    }

    static get developmentGuild() {
        return "329498711338123268";
    }

    static get useGuildCommands() {
        return false;
    }

    static get userAgent() {
        return `MaidBoye/${pkg.version} (https://github.com/DonovanDMC/MaidBoye)`;
    }

    static get clientID() {
        return this.isDevelopment ? betaClient.id : prodClient.id;
    }
    static get clientToken() {
        return this.isDevelopment ? betaClient.token : prodClient.token;
    }
    static get clientSecret() {
        return this.isDevelopment ? betaClient.secret : prodClient.secret;
    }
    static get clientOptions(): ClientOptions {
        return {
            allowedMentions: {
                users:       true,
                roles:       false,
                everyone:    false,
                repliedUser: false
            },
            auth:               `Bot ${this.clientToken}`,
            defaultImageFormat: "png",
            defaultImageSize:   4096,
            gateway:            {
                autoReconnect: true,
                concurrency:   "auto",
                intents:       [
                    "GUILDS",
                    "GUILD_MEMBERS",
                    "GUILD_BANS",
                    "GUILD_EMOJIS_AND_STICKERS",
                    "GUILD_INTEGRATIONS",
                    "GUILD_WEBHOOKS",
                    "GUILD_INVITES",
                    "GUILD_VOICE_STATES",
                    "GUILD_MESSAGES",
                    "GUILD_MESSAGE_REACTIONS",
                    "DIRECT_MESSAGES",
                    "MESSAGE_CONTENT",
                    "GUILD_SCHEDULED_EVENTS",
                    "AUTO_MODERATION_CONFIGURATION",
                    "AUTO_MODERATION_EXECUTION"
                ],
                maxShards: "auto",
                presence:  {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "Starting.."
                    }],
                    status: "dnd"
                }
            }
        };
    }

    /* api keys */
    static override get yiffyAPIKey() {
        return super.yiffyAPIKey;
    }
    static override get e621User() {
        return super.e621User;
    }
    static override get e621APIKey() {
        return super.e621APIKey;
    }
    static override get cheweyAPIKey() {
        return super.cheweyAPIKey;
    }
    static override get fluxpointAPIKey() {
        return super.fluxpointAPIKey;
    }
    static override get imgenAPIKey() {
        return super.imgenAPIKey;
    }
    static override get saucenaoAPIKey() {
        return super.saucenaoAPIKey;
    }
    static override get proxyAuth() {
        return super.proxyAuth;
    }
    static override get tempAuth() {
        return super.tempAuth;
    }

    /* db */
    static get dbHost() {
        return "172.19.3.3";
    }
    static get dbPort() {
        return 5432;
    }
    static get dbUser() {
        return "maidboye";
    }
    static get dbPassword() {
        // we need to explicitly return undefined
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
    }
    static get dbSSL() {
        return false;
    }
    static get dbDatabase() {
        return "maidboye";
    }

    /* redis */
    static get redisHost() {
        return "172.19.3.4";
    }
    static get redisPort() {
        return 6379;
    }
    static get redisUser() {
        return "default";
    }
    static get redisPassword() {
        // we need to explicitly return undefined
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
    }
    static get redisDb() {
        return 0;
    }

    static get yiffTypes() {
        return [
            "gay",
            "straight",
            "lesbian",
            "gynomorph",
            "andromorph"
        ] as const;
    }

    static get e621ThumbnailTypes() {
        return [
            "none",
            "image",
            "gif"
        ] as const;
    }

    // Image Credit: Raypop#2504
    // https://discord.com/users/392445132068093954
    static get ["8ballAnswers"]() {
        return [
            // Neutral
            "https://assets.maid.gay/8Ball/Neutral1.png",
            "https://assets.maid.gay/8Ball/Neutral2.png",
            "https://assets.maid.gay/8Ball/Neutral3.png",

            // Positive
            "https://assets.maid.gay/8Ball/Positive1.png",
            "https://assets.maid.gay/8Ball/Positive2.png",
            "https://assets.maid.gay/8Ball/Positive3.png",

            // Negative
            "https://assets.maid.gay/8Ball/Negative1.png",
            "https://assets.maid.gay/8Ball/Negative2.png",
            "https://assets.maid.gay/8Ball/Negative3.png"
        ];
    }

    /* icons */
    static get botIcon() {
        return "https://i.maid.gay/icon.png";
    }
    static get botSauce() {
        return "https://e621.net/posts/2907560";
    }
    static get devIcon() {
        return "https://furry.cool/icon";
    }
    static get devSauce() {
        return "https://furry.cool/sauce";
    }
    static get noIcon() {
        return "https://assets.maid.gay/noicon.png";
    }
    static get bapGif() {
        return "https://assets.maid.gay/bap.gif";
    }
    static get bellyrubGif() {
        return "https://assets.maid.gay/bellyrub.gif";
    }

    /* directories */
    static get baseDir() {
        return new URL(`../../${import.meta.url.endsWith(".js") ? "../" : ""}`, import.meta.url).pathname.slice(0, -1);
    }

    static get dataDir() {
        return this.isDocker ? "/data" : `${this.baseDir}/data/bot`;
    }

    static get bulkDeleteDir() {
        return `${this.dataDir}/bulk-delete`;
    }

    static get logsDirectory() {
        return `${this.dataDir}/logs`;
    }

    static get eventsDirectory() {
        return new URL("../events", import.meta.url).pathname;
    }

    static get commandsDirectory() {
        return new URL("../interactions/applicationCommands", import.meta.url).pathname;
    }

    static get jsonDirectory() {
        return new URL("json", import.meta.url).pathname;
    }

    /* s3 */
    static override get s3Accesskey() {
        return super.s3Accesskey;
    }
    static override get s3SecretKey() {
        return super.s3SecretKey;
    }
    static get thumbsEndpoint() {
        return "thumbs-v2.yiff.media";
    }
    static get thumbsRegion() {
        return "us-central-1";
    }
    static get thumbsBucket() {
        return "thumbs-v2.yiff.media";
    }
    static get thumbsURL() {
        return "https://thumbs-v2.yiff.media";
    }

    /* links */
    static get discordLink() {
        return "https://discord.gg/8k8WHcyf57";
    }
    static get webLink() {
        return "https://maid.gay";
    }
    static get privacyPolicyLink() {
        return "https://maid.gay/privacy";
    }
    static get inviteLink() {
        return "https://api.maid.gay/links/invite";
    }
    static get inviteRedirectURI() {
        return "https://api.maid.gay/links/invite/done";
    }
    static get devLink() {
        return "https://furry.cool";
    }
    static get twitterLink() {
        return "https://twitter.com/MaidBoye";
    }
    static get donationLink() {
        return "https://ko-fi.com/MaidBoye";
    }
    static get invitePermissions() {
        return ([
            "KICK_MEMBERS",
            "BAN_MEMBERS",
            "ADMINISTRATOR",
            "MANAGE_CHANNELS",
            "MANAGE_GUILD",
            "VIEW_AUDIT_LOG",
            "VIEW_CHANNEL",
            "SEND_MESSAGES",
            "MANAGE_MESSAGES",
            "EMBED_LINKS",
            "ATTACH_FILES",
            "READ_MESSAGE_HISTORY",
            "USE_EXTERNAL_EMOJIS",
            "MUTE_MEMBERS",
            "DEAFEN_MEMBERS",
            "MOVE_MEMBERS",
            "MANAGE_ROLES",
            "MANAGE_WEBHOOKS",
            "MANAGE_EMOJIS_AND_STICKERS",
            "MANAGE_EVENTS",
            "MANAGE_THREADS",
            "SEND_MESSAGES_IN_THREADS",
            "MODERATE_MEMBERS"
        ] as const).reduce((a, b) => a | Permissions[b], 0n);
    }

    /* statuses */
    static getPresence(time = new Date()): UpdatePresenceOptions | undefined {
        const list: Array<{
            presence: UpdatePresenceOptions;
            filter(hour: number, minute: number, second: number): boolean;
        }> = [
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "with other femboys"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 0 && second === 0
            },
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "with you~"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 0 && second === 20
            },
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "lifting my tail >w>"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 0 && second === 40
            },
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: ">w<"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 1 && second === 0
            },
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.GAME,
                        name: "servicing you~"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 1 && second === 20
            },
            {
                presence: {
                    activities: [{
                        type: ActivityTypes.WATCHING,
                        name: "you~"
                    }],
                    status: "online"
                },
                filter: (hour: number, minute: number, second: number) => (minute % 2) === 1 && second === 40
            }
        ];

        return list.find(item => item.filter(time.getHours(), time.getMinutes(), time.getSeconds()))?.presence;
    }

    /* api */
    static override get cookieSecret() {
        return super.cookieSecret;
    }
    static get apiListener() {
        return this.isDocker ? "0.0.0.0" : "127.0.0.1";
    }
    static get apiPort() {
        return 8080;
    }
    static get apiSecure() {
        return !this.isDevelopment;
    }
    static get apiHost() {
        return this.isDevelopment ? this.apiListener : "api.maid.gay";
    }
    static get apiURL() {
        return `http${this.apiSecure ? "s" : ""}://${this.apiHost}${[80, 443].includes(this.apiPort) ? "" : `:${this.apiPort}`}`;
    }

    /* leveling */
    static get levelingStartRate() {
        return 100;
    }
    static get levelingFlatRate() {
        return 2000;
    }
    static get levelingFlatRateStart() {
        return 20;
    }
    static get lbPerPage() {
        return 10;
    }
    // 700 ms with 100,000 keys
    // 900ms with 200,000 keys
    // 1700ms with 300,000 keys
    // 2500ms with 400,000 keys
    static get lbGlobalCacheTime() {
        return 90;
    }
    // 80ms with 100,000 keys
    // 120ms with 200,000 keys
    // 200ms with 300,000 keys
    // 300ms with 400,000 keys
    static get lbServerCacheTime() {
        return 30;
    }

    static get emojis() {
        return emojis;
    }

    static override get encryptionKey() {
        return super.encryptionKey;
    }

    static override get encryptionSalt() {
        return super.encryptionSalt;
    }
}
