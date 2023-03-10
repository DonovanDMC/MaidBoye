import Leveling from "../../util/Leveling.js";
import Util from "../../util/Util.js";
import { getClient } from "../../util/ClientInstanceHelper.js";
import { Router } from "express";

const app = Router();

app.route("/guilds/:guild")
    .get(Util.apiAuth(), async(req, res) => {
        const guild = getClient().guilds.get(req.params.guild);
        if (!guild) {
            return res.status(404).end({ error: "Guild not found." });
        }
        const userInGuild = await getClient().getMember(guild.id, req.data.uConfig!.id);
        if (!userInGuild) {
            return res.status(403).end({ error: "You are not in this guild." });
        }
        const lb = await Leveling.getLeaderboard(req.params.guild, -1);
        let limit = req.query.limit ? Number(req.query.limit) : 1000;
        let page = req.query.page ? Number(req.query.page) : 1;
        if (limit < 1) {
            limit = 1;
        }
        if (limit > 2500) {
            limit = 2500;
        }
        if (page < 1) {
            page = 1;
        }
        if (page > (lb.values.length / limit) + 1) {
            page = Math.floor(lb.values.length / limit) + 1;
        }
        return res.status(200).json({
            values: lb.values.slice((page - 1) * limit, page * limit),
            total:  lb.total
        });
    });

app.route("/guilds/:guild/users/:user")
    .get(Util.apiAuth(), async(req, res) => {
        const guild = getClient().guilds.get(req.params.guild);
        if (!guild) {
            return res.status(404).end({ error: "Guild not found." });
        }
        const userInGuild = await getClient().getMember(guild.id, req.data.uConfig!.id);
        if (!userInGuild) {
            return res.status(403).end({ error: "You are not in this guild." });
        }

        const lb = await Leveling.getLeaderboard(req.params.guild, -1, req.params.user);
        return res.status(200).json(lb);
    });

app.route("/users/:user")
    .get(Util.apiAuth(), async(req, res) => {
        const lb = await Leveling.getLeaderboard(null, -1, req.params.user);
        return res.status(200).json(lb);
    });

app.route("/")
    .get(Util.apiAuth(), async(req, res) => {
        const lb = await Leveling.getLeaderboard(null, -1);
        let limit = req.query.limit ? Number(req.query.limit) : 1000;
        let page = req.query.page ? Number(req.query.page) : 1;
        if (limit < 1) {
            limit = 1;
        }
        if (limit > 2500) {
            limit = 2500;
        }
        if (page < 1) {
            page = 1;
        }
        if (page > (lb.values.length / limit) + 1) {
            page = Math.floor(lb.values.length / limit) + 1;
        }
        return res.status(200).json({
            values: lb.values.slice((page - 1) * limit, page * limit),
            total:  lb.total
        });
    });

export default app;
