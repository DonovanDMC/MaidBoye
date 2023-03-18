import ModLogHandler from "./ModLogHandler.js";
import db from "../../db/index.js";
import type { TimedData } from "../../db/Models/Timed.js";
import Timed, { TimedType } from "../../db/Models/Timed.js";
import type MaidBoye from "../../main.js";
import UserConfig from "../../db/Models/UserConfig.js";
import GuildConfig from "../../db/Models/GuildConfig.js";
import type { ModLogData } from "../../db/Models/ModLog.js";
import ModLog, { ModLogType } from "../../db/Models/ModLog.js";
import { Colors } from "../Constants.js";
import Logger from "@uwu-codes/logger";
import { randomUUID } from "node:crypto";

export default class TimedModerationHandler {
    private static client: MaidBoye;
    private static interval: NodeJS.Timeout | undefined;
    private static processed = [] as Array<string>;

    static async add(type: TimedType, guild_id: string, user_id: string, time: number) {
        const id = randomUUID();
        await UserConfig.createIfNotExists(user_id);
        return Timed.create({
            id,
            type,
            guild_id,
            user_id,
            time,
            expires_at: new Date(Date.now() + time)
        });
    }

    static async init(client: MaidBoye) {
        this.client = client;
        this.interval = setInterval(this.process.bind(this), 1e3);
        Logger.getLogger("TimedModerationHandler").info("Initialized");
    }

    static async process() {
        const d = new Date();
        if (d.getMinutes() !== 0 || d.getSeconds() !== 0) {
            return;
        }
        await this.processExpiry();
        await this.processRenewal();
    }

    static async processExpiry() {
        const rows = (await db.query<TimedData>(`SELECT * FROM ${Timed.TABLE} WHERE expires_at <= CURRENT_TIMESTAMP(3)`)).rows.map(r => new Timed(r));
        for (const row of rows) {
            if (this.processed.includes(row.id)) {
                continue;
            }
            this.processed.push(row.id);
            Logger.getLogger("TimedModerationHandler").debug(`Processing timed entry "${row.id}" for the guild "${row.guildID}"`);
            const gConfig = await GuildConfig.get(row.guildID);
            const guild = this.client.guilds.get(row.guildID);
            const [log = null] = (await db.query<ModLogData>(`SELECT * FROM ${ModLog.TABLE} WHERE guild_id = $1 AND (type = $2 OR type = $3)`, [row.guildID, ModLogType.BAN, ModLogType.MUTE])).rows.map(r => new ModLog(r));
            const target = await this.client.getUser(row.userID);
            const blame = log ? await log.getBlame(this.client) : null;
            if (target === null || !guild) {
                await this.remove(row.id);
                continue;
            }

            const check = await ModLogHandler.check(gConfig);
            switch (row.type) {
                case TimedType.BAN: {
                    const unban = await guild.removeBan(target.id, `Timed Unban (${blame?.tag ?? "Unknown"})`).then(() => true, () => false);
                    if (check) {
                        await (unban ? ModLogHandler.createEntry({
                            type:   ModLogType.UNBAN,
                            guild,
                            gConfig,
                            blame:  null,
                            reason: "Timed Action",
                            target
                        }) : ModLogHandler.executeWebhook(guild, gConfig, null, ModLogType.UNBAN, 0, Colors.red, `I failed to automatically unban <@!${target.id}>..`, "Automatic Unban Failed"));
                    }
                    await this.remove(row.id);
                    break;
                }

                case TimedType.MUTE: {
                    const member = await this.client.getMember(row.guildID, target.id);
                    if (!member?.communicationDisabledUntil) {
                        await this.remove(row.id);
                        continue;
                    }

                    const unmute = await member.edit({ communicationDisabledUntil: null }).then(() => true, () => false);
                    if (check) {
                        await (unmute ? ModLogHandler.createEntry({
                            type:   ModLogType.UNMUTE,
                            guild,
                            gConfig,
                            blame:  null,
                            reason: "Timed Action",
                            target: member
                        }) : ModLogHandler.executeWebhook(guild, gConfig, null, ModLogType.UNMUTE, 0, Colors.red, `I failed to automatically unmute <@!${target.id}>..`, "Automatic Unmute Failed"));
                        continue;
                    }
                    await this.remove(row.id);
                    break;
                }
            }
        }
    }

    static async processRenewal() {
        // check for 25 days ago
        const renewalCheck = new Date(Date.now() - 1000 * 60 * 60 * 24 * 25);
        // renew for 28 days (the max)
        const renewalDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 28);
        const rows = (await db.query<TimedData>(`SELECT * FROM ${Timed.TABLE} WHERE expires_at >= CURRENT_TIMESTAMP(3) AND type = $1 AND renewed_at <= $2`, [TimedType.MUTE, renewalCheck.toISOString()])).rows.map(r => new Timed(r));
        for (const row of rows) {
            if (this.processed.includes(row.id)) {
                continue;
            }
            this.processed.push(row.id);
            Logger.getLogger("TimedModerationHandler").debug(`Processing renewal of entry "${row.id}" for the guild "${row.guildID}"`);
            const gConfig = await GuildConfig.get(row.guildID);
            const guild = this.client.guilds.get(row.guildID);
            const target = await this.client.getUser(row.userID);
            if (target === null || !guild) {
                await this.remove(row.id);
                continue;
            }
            const check = await ModLogHandler.check(gConfig);
            const member = await this.client.getMember(row.guildID, target.id);
            if (!member?.communicationDisabledUntil) {
                await this.remove(row.id);
                continue;
            }

            const unmute = await member.edit({ communicationDisabledUntil: (renewalDate > row.expiresAt ? row.expiresAt : renewalDate).toISOString(), reason: `Mute Renewal (expiry: ${row.expiresAt.getDate()}/${row.expiresAt.getMonth() + 1}/${row.expiresAt.getFullYear()})` }).then(() => true, () => false);
            if (check && !unmute) {
                await ModLogHandler.executeWebhook(guild, gConfig, null, ModLogType.MUTE, 0, Colors.red, `I failed to renew <@!${target.id}>'s mute..`, "Unmute Renewal Failed");
            }
            await row.edit({ renewed_at: new Date() });
        }
    }

    static async remove(id: string) {
        if (this.processed.includes(id)) {
            this.processed.splice(this.processed.indexOf(id), 1);
        }
        return db.delete(Timed.TABLE, id);
    }

    static stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = undefined;
        Logger.getLogger("TimedModerationHandler").info("Stopped");
    }
}
