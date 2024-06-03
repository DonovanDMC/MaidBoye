import Yiffy from "./req/Yiffy.js";
import type { E621ThumbnailType } from "../db/Models/UserConfig.js";

export default class E621Thumbnail {
    // so we don't override if we've already navigated away
    private static pendingList: Array<[string, number]> = [];
    static addPending(message: string, post: number) {
        if (this.hasPending(message, post)) {
            return false;
        } else {
            // remove pending for any other post ids
            if (this.hasPending(message)) {
                this.removePending(message);
            }
            this.pendingList.push([message, post]);
            return true;
        }
    }

    static async create(_url: string, md5: string, type: Exclude<E621ThumbnailType, "none">) {
        return Yiffy.thumbs.create(md5, type === "image" ? "png" : "gif");
    }

    static hasPending(message: string, post?: number) {
        return this.pendingList.some(p => p[0] === message && (!post || p[1] === post)) !== undefined;
    }

    static removePending(message: string) {
        if (this.hasPending(message)) {
            const p = this.pendingList.filter(l => l[0] === message);
            for (const l of p) {
                this.pendingList.splice(this.pendingList.indexOf(l), 1);
            }
            return p.length !== 0;
        } else {
            return false;
        }
    }
}
