import db from "../../db/index.js";
import { createHash } from "crypto";

export default class E621TagsState {
    static async get(id: string) {
        const get = await db.redis.get(`e621-tags:${id}`);
        if (!get) return null;
        return Buffer.from(get, "base64url").toString("ascii").split(" ");
    }

    static async store(tags: Array<string>) {
        const id = createHash("md5").update(tags.join(" ")).digest("hex");
        await db.redis.set(`e621-tags:${id}`, Buffer.from(tags.join(" ")).toString("base64url"));
        return id;
    }
}
