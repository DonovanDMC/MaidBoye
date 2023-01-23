import db from "../../db/index.js";

export default class DailyGuildsHandler {
    static async get(date = new Date()) {
        const dd = `${(date.getDate()).toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
        const [daily, join, leave, joinTotal, leaveTotal, total] = await db.redis.mget(
            `guilds:daily:${dd}`,
            `guilds:daily:${dd}:joined`,
            `guilds:daily:${dd}:left`,
            "guilds:joined",
            "guilds:left",
            "guilds:total"
        );
        return {
            net:        Number(daily ?? 0),
            join:       Number(join ?? 0),
            leave:      Number(leave ?? 0),
            joinTotal:  Number(joinTotal ?? 0),
            leaveTotal: Number(leaveTotal ?? 0),
            total:      Number(total ?? 0)
        };
    }

    static async trackJoin() {
        const d = new Date();
        const dd = `${(d.getDate()).toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
        await db.redis.multi()
            .incr(`guilds:daily:${dd}`)
            .incr(`guilds:daily:${dd}:joined`)
            .incr("guilds:total")
            .incr("guilds:joined")
            .exec();
    }

    static async trackLeave() {
        const d = new Date();
        const dd = `${(d.getDate()).toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
        await db.redis.multi()
            .decr(`guilds:daily:${dd}`)
            .incr(`guilds:daily:${dd}:left`)
            .decr("guilds:total")
            .incr("guilds:left")
            .exec();
    }
}
