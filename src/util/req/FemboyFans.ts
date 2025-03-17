/// <reference path="../@types/femboyfans.d.ts" />
import Config from "../../config/index.js";
import Util from "../Util.js";
import Logger from "@uwu-codes/logger";
import { fileTypeFromBuffer } from "file-type";

export default class FemboyFans {
    static AUTH = `Basic ${Buffer.from(`${Config.femboyFansUser}:${Config.femboyFansKey}`).toString("base64")}`;
    static URL = "https://femboy.fan";

    static async getPost(id: number): Promise<FemboyFans.Post | null> {
        const result = await fetch(`${this.URL}/posts/${id}`, {
            headers: {
                "Authorization": this.AUTH,
                "User-Agent":    Config.userAgent
            }
        });
        if (result.status !== 200) {
            Logger.getLogger("FemboyFans#getPost").error(`Unexpected ${result.status} ${result.statusText}:`);
            Logger.getLogger("FemboyFans#getPost").error(await result.text());
            return null;
        }
        return (result.json() as Promise<FemboyFans.Post>);
    }

    static async getPostByMD5(md5: string): Promise<FemboyFans.Post | null> {
        const result = await fetch(`${this.URL}/posts.json?md5=${md5}`, {
            headers: {
                "Authorization": this.AUTH,
                "User-Agent":    Config.userAgent
            }
        });
        if (result.status !== 200) {
            if (result.status !== 404) {
                Logger.getLogger("FemboyFans#getPostByMD5").error(`Unexpected ${result.status} ${result.statusText}:`);
                Logger.getLogger("FemboyFans#getPostByMD5").error(await result.text());
            }
            return null;
        }
        return (result.json() as Promise<Array<FemboyFans.Post>>).then(([post]) => post);
    }

    static async queryIQDB(img: Buffer, similarity = 60): Promise<{ post_id: number; score: number; } | null> {
        img = await Util.convertImageIQDB(img);
        const type = await fileTypeFromBuffer(img);
        if (type === undefined) {
            return null;
        }
        const body = new FormData();
        body.append("file", new Blob([img], { type: type.mime }));
        const result = await fetch(`${this.URL}/posts/iqdb.json?search[score_cutoff]=${similarity}`, {
            method: "POST",
            body
        });

        if (result.status !== 200) {
            Logger.getLogger("FemboyFans#queryIQDB").error(`Unexpected ${result.status} ${result.statusText}:`);
            Logger.getLogger("FemboyFans#queryIQDB").error(await result.text());
            return null;
        }

        const res = (await result.json()) as Array<{ post_id: number; score: number; }>;
        return res.sort((a, b) => b.score - a.score).at(0) ?? null;
    }
}
