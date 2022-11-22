import Debug from "./Debug.js";
import Util from "./Util.js";
import db from "../db/index.js";
import UserConfig from "../db/Models/UserConfig.js";
import GuildConfig from "../db/Models/GuildConfig.js";
import Config from "../config/index.js";
import { Utility } from "@uwu-codes/utils";
import chunk from "chunk";
import { AnyGuildTextChannel, GuildCommandInteraction, Message, Interaction } from "oceanic.js";

export default class Leveling {

    static calcExp(level: number) {
        const k = {
            level: level < Config.levelingFlatRateStart ? level * Config.levelingStartRate : Config.levelingFlatRate,
            total: 0
        };
        if (level <= Config.levelingFlatRateStart) for (let i = 0; i <= level; i++) k.total += i < Config.levelingFlatRateStart ? i * 100 : Config.levelingFlatRate;
        else {
            const { total: t } = this.calcExp(Config.levelingFlatRateStart);
            k.total = t + (level - Config.levelingFlatRateStart) * Config.levelingFlatRate;
        }
        return k;
    }

    static calcLevel(xp: number) {
        let e = Number(xp), level = 0, complete = false;
        const { total: t } = this.calcExp(Config.levelingFlatRateStart);
        if (xp <= t) {
            while (!complete) {
                const l = this.calcExp(level + 1).level;
                if (e >= l) {
                    e -= l;
                    level++;
                } else complete = true;
            }
        } else {
            // leftover exp after Config.levelingFlatRateStart
            const l = xp - t;
            // leftover exp
            const a = l % Config.levelingFlatRate;
            // levels above Config.levelingFlatRateStart
            const b = Math.floor(l / Config.levelingFlatRate);
            level = b + Config.levelingFlatRateStart;
            e = a;
        }

        return {
            level,
            total:    xp,
            leftover: e,
            needed:   this.calcExp(level + 1).level - e
        };
    }

    static async getLeaderboard(guild: string | null, page = 1, user: string | null = null) {
        if (page !== -1) {
            const cache = await db.redis.get(`leveling:leaderboard:${guild || "global"}:${page}`);
            const cacheTotal = await db.redis.get(`leveling:leaderboard:${guild || "global"}:total`);
            if (cache) {
                return {
                    values: JSON.parse(cache) as typeof values,
                    total:  cacheTotal ? Number(cacheTotal) : await this.getLeaderboardSize(guild)
                };
            }
        }
        const keys = (await Utility.getKeys(db.redis, `leveling:${user || "*"}:${guild || "*"}`, 100000)).filter(key => /^leveling(?::\d{15,21}){2}$/.test(key));
        let values: Array<{ guild: string; user: string; xp: { leftover: number; level: number; needed: number; total: number; }; }> = [];
        // mget has issues when dealing with tons of keys
        for (const keySet of chunk(keys, 50000)) {
            values.push(...(await db.redis.mget(...keySet)).map(Number).filter(Boolean).map((val, index) => ({
                user:  keys[index].split(":")[1],
                guild: keys[index].split(":")[2],
                xp:    this.calcLevel(val)
            })));
        }
        values = values.sort((a, b) => b.xp.total - a.xp.total).slice(...(page === -1 ? [undefined, undefined] : [(page - 1) * Config.lbPerPage, page * Config.lbPerPage]));
        if (page !== -1) {
            await db.redis.setex(`leveling:leaderboard:${guild || "global"}:${page}`, guild ? Config.lbServerCacheTime : Config.lbGlobalCacheTime, JSON.stringify(values));
            await db.redis.setex(`leveling:leaderboard:${guild || "global"}:total`, guild ? Config.lbServerCacheTime : Config.lbGlobalCacheTime, keys.length);
        }
        return {
            values,
            total: keys.length
        };
    }

    static async getLeaderboardSize(guild: string | null) {
        return (await Utility.getKeys(db.redis, `leveling:*:${guild || "*"}`, 100000)).filter(key => /^leveling(?::\d{15,21}){2}$/.test(key)).length;
    }

    static async getUserRank(user: string, guild: string | null) {
        const { values: lb, total } = await this.getLeaderboard(guild, -1);
        const index = lb.findIndex(u => u.user === user);
        return { rank: index === -1 ? -1 : index + 1, total };
    }

    static async run(input: GuildCommandInteraction | Message<AnyGuildTextChannel>) {
        const user = input instanceof Interaction ? input.user : input.author;
        if (user.bot) return;
        const d = await db.redis.exists(`leveling:${user.id}:${input.guildID}:cooldown`);
        if (d) return;
        await db.redis.setex(`leveling:${user.id}:${input.channel.guildID}:cooldown`, 60, "");
        const oldXP = await UserConfig.getXP(user.id, input.guildID);
        const { level: oldLevel } = this.calcLevel(oldXP);
        const xp = await UserConfig.addXP(user.id, input.guildID);
        const { level } = this.calcLevel(xp);
        if (level > oldLevel) {
            Debug("leveling", `${user.tag} (${user.id}, ${input.guildID}) leveled up from ${oldLevel} to ${level}`);
            const gConfig = await GuildConfig.get(input.guildID);
            const roles = gConfig.levelingRoles.filter(([role, reqLevel]) => this.calcExp(reqLevel).level <= xp && !input.member.roles.includes(role)).map(([role]) => role);
            if (roles.length !== 0) {
                for (const role of roles) {
                    Debug("leveling:roles", `Adding the role ${role} to ${user.tag} (${user.id}, ${input.guildID}) for leveling up from ${oldLevel} to ${level}`);
                    await input.member.addRole(role, `Leveling (${oldLevel} -> ${level})`).catch(() => {
                        Debug("leveling:roles", `failed to add the role ${role} to ${user.tag} (${user.id}, ${input.guildID})`);
                    });
                }
            }
            if (gConfig.settings.announceLevelUp) {
                let m: Message;
                if (input.channel.permissionsOf(input.client.user.id).has("SEND_MESSAGES")) {
                    const   content = input.channel.permissionsOf(input.channel.client.user.id).has("EMBED_LINKS") ? {
                        embeds: Util.makeEmbed(true, user)
                            .setTitle("Level Up!")
                            .setDescription(`<@!${user.id}> leveled up from **${oldLevel}** to **${level}**!`, roles.length === 0 ? [] : [
                                "",
                                "Roles Gained:",
                                ...roles.map(r => `- <@&${r}>`)
                            ])
                            .toJSON(true)
                    } : {
                        content:         `Congrats <@!${user.id}> on leveling up from **${oldLevel}** to **${level}**!${roles.length === 0 ? "" : `\n\nRoles Gained:\n${roles.map(r => `- <@&${r}>`).join("\n")}`}`,
                        allowedMentions: { users: false, roles: false }
                    };
                    m = await (input instanceof Interaction ? input.createFollowup(content) : input.channel.createMessage(content));
                    setTimeout(async() => {
                        await m.delete().catch(() => null);
                    }, 2e4);
                } else void user.createDM().then(ch => ch.createMessage({ content: `You leveled up in **${input.channel.guild.name}** from **${oldLevel}** to **${level}**\n${roles.length === 0 ? "" : `\n\nRoles Gained:\n${roles.map(r => `- ${input.channel.guild.roles.get(r)?.name || `<@&${r}>`}`).join("\n")}`}\n\n(I sent this here because I couldn't create messages in the channel you leveled up in)` }));
            }
        }
    }
}
