import db from "../../db/index.js";
import TextEncoding from "../../util/TextEncoding.js";
import { createHash } from "node:crypto";

export default class E621TagsState {
    static async get(id: string) {
        const get = await db.redis.get(`e621-tags:${id}`);
        if (get === null) {
            return null;
        }
        return TextEncoding.decode(get).split(" ");
    }

    static async store(tags: Array<string>) {
        const id = createHash("md5").update(tags.join(" ")).digest("hex");
        await db.redis.set(`e621-tags:${id}`, TextEncoding.encode(tags.join(" ")));
        return id;
    }
}
