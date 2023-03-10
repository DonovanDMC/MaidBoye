import Util from "../../util/Util.js";
import WelcomeMessageHandler from "../../util/handlers/WelcomeMessageHandler.js";
import { getClient } from "../../util/ClientInstanceHelper.js";
import { Router } from "express";

const app = Router();

app.route("/:guild/:user/:type")
    .put(Util.apiAuth(), async(req, res) => {
        const type = req.params.type as "join" | "leave";
        if (!["join", "leave"].includes(type)) {
            return res.status(404).end({ error: "Invalid type." });
        }
        const guild = getClient().guilds.get(req.params.guild);
        if (!guild) {
            return res.status(404).end({ error: "Guild not found." });
        }
        const userInGuild = await getClient().getMember(guild.id, req.data.uConfig!.id);
        if (!userInGuild) {
            return res.status(403).end({ error: "You are not in this guild." });
        }
        if (!userInGuild.permissions.has("ADMINISTRATOR")) {
            return res.status(403).end({ error: "You do not have permission to do this." });
        }

        const user = await getClient().getMember(req.params.guild, req.params.user);
        if (!user) {
            return res.status(404).end({ error: "User not found." });
        }

        const sent = await WelcomeMessageHandler.handle(user, type, req.query.force === "true");

        return res.status(sent ? 201 : 200).end();
    });

export default app;
