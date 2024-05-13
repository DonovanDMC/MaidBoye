import Config from "../../config/index.js";
import type { BulkDeleteReport } from "../../util/@types/misc.js";
import EncryptionHandler from "../../util/handlers/EncryptionHandler.js";
import { PermissionsByName } from "../../util/Names.js";
import { Router } from "express";
import { access, readFile } from "node:fs/promises";

const app = Router();

app.route("/:id")
    .get(async(req,res) => {
        if (await access(`${Config.bulkDeleteDir}/${req.params.id}.json`).then(() => true, () => false)) {
            const { channel: [channelID, channelName], createdAt, expiresAt, guild: [guildID, guildName], messageCount, messages } = JSON.parse(EncryptionHandler.decrypt(await readFile(`${Config.bulkDeleteDir}/${req.params.id}.json`, "utf8"))) as BulkDeleteReport;
            const text = [
                "-- Begin Bulk Deletion Report --",
                `Created At: ${new Date(createdAt).toUTCString()}`,
                `Expires At: ${new Date(expiresAt).toUTCString()}`,
                `Total Messages: ${messageCount}`,
                `Server: ${EncryptionHandler.decrypt(guildName)} (${guildID})`,
                `Channel: ${EncryptionHandler.decrypt(channelName)} (${channelID})`,
                "",
                "-- Begin Messages --",
                ...messages.map(msg => `[${new Date(msg.timestamp).toUTCString()}][${EncryptionHandler.decrypt(msg.author)}]: ${msg.content ? EncryptionHandler.decrypt(msg.content) : "[No Content]"}`),
                "-- End Messages --",
                "",
                "-- Begin Disclaimers --",
                "* If you do not want bulk delete reports to be made, disable logging for Bulk Message Delete.",
                "* If you want this report deleted, contact a developer.",
                `* Treat the report id like a password. Anyone in the server with the ${PermissionsByName.MANAGE_MESSAGES} permission can view it.`,
                "-- End Disclaimers --",
                "-- End Bulk Deletion Report --"
            ].join("\n");
            return res.status(200).header("Content-Type", "text/plain").end(text);
        } else {
            return res.status(404).end("Unknown Report.");
        }
    });

export default app;
