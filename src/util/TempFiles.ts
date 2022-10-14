import Config from "../config/index.js";
import { fetch, FormData, File } from "undici";
import { fileTypeFromBuffer } from "file-type";
import { randomBytes } from "node:crypto";

export default class TempFiles {
    static async add(file: Buffer) {
        const fd = new FormData();
        const info = await fileTypeFromBuffer(file);
        fd.append("file", new File([file], `file.${info?.ext || "png"}`));
        const id = randomBytes(32).toString("hex");
        return fetch(`https://proxy.yiff.rocks/${id}`, {
            method:  "PUT",
            headers: {
                "User-Agent":    Config.userAgent,
                "Authorization": Config.tempAuth
            },
            body: fd
        }).then(res => res.text());
    }
}
