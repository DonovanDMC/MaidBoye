import Config from "../../config/index.js";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export default class EncryptionHandler {
    static algorithm = "aes256";
    static key = scryptSync(Config.encryptionKey, Config.encryptionSalt, 32);
    static decrypt(text: string) {
        const [iv, encrypted] = text.split(":");
        const decipher = createDecipheriv(this.algorithm, this.key, Buffer.from(iv, "hex"));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]);
        return decrypted.toString();
    }

    static encrypt(text: string) {
        const iv = randomBytes(16);
        const cipher = createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
        return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    }
}
