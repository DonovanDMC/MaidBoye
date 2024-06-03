import Util from "./Util.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import db from "../db/index.js";
import type MaidBoye from "../main.js";
import type { Invite, Member } from "oceanic.js";

export default class InviteTracker {
    static async handleJoin(member: Member) {
        const events = await LogEvent.getType(member.guildID, LogEvents.INVITE_TRACKING);
        if (events.length === 0) {
            return;
        }

        const invites = await member.guild.getInvites();
        const values = Object.fromEntries((await db.redis.mget(invites.map(i => `invites:${member.guildID}:${i.code}`))).map((val, index) => [invites[index].code, val === null ? 0 : Number(val)]));
        let invite: Invite | undefined;
        for (const i of invites) {
            if (values[i.code] === undefined) {
                continue;
            }
            if (values[i.code] < i.uses) {
                invite = i;
                break;
            }
        }

        if (invite === undefined) {
            return;
        }

        if (invites.length !== 0) {
            await db.redis.mset(invites.flatMap(i => [`invites:${member.guildID}:${i.code}`, i.uses]));
        }
        for (const event of events) {
            await event.execute(member.client as MaidBoye, {
                embeds: Util.makeEmbed(true, member)
                    .setTitle("Invite Tracking")
                    .setDescription(`${member.mention} joined using the invite **https://discord.gg/${invite.code}**`)
                    .toJSON(true)
            });
        }
    }

    static async trackCreate(guild: string, code: string) {
        const events = await LogEvent.getType(guild, LogEvents.INVITE_TRACKING);
        if (events.length === 0) {
            return;
        }

        await db.redis.set(`invites:${guild}:${code}`, 0);
    }

    static async trackDelete(guild: string, code: string) {
        const events = await LogEvent.getType(guild, LogEvents.INVITE_TRACKING);
        if (events.length === 0) {
            return;
        }

        const uses = await db.redis.get(`invites:${guild}:${code}`);
        if (uses === null) {
            return;
        }

        await db.redis.del(`invites:${guild}:${code}`);
    }
}
