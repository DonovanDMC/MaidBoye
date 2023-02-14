import Config from "../../config/index.js";
import type MaidBoye from "../../main";
import { manualPost } from "blapi";

export default class BotListUpdater {
    static client: MaidBoye;
    static async init(client: MaidBoye) {
        this.client = client;
        await this.post();
        setInterval(() => this.post(), 1000 * 60 * 15);
    }

    static async post() {
        await manualPost(this.client.guilds.size, this.client.user.id, Config.botLists, undefined, this.client.shards.size, this.client.shards.map(s => this.client.guilds.filter(g => g.shard.id === s.id).length));
    }
}
