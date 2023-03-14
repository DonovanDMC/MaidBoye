import Config from "../../config/index.js";
import db from "../../db/index.js";
import { getClient } from "../../util/ClientInstanceHelper.js";
import { Router, type Request } from "express";
import { OAuthHelper, OAuthScopes } from "oceanic.js";

const app = Router();


app.route("/invite/done")
    .get(async(req: Request<object, never, never, { code: string; guild_id: string; permissions: string; state: string;}>, res) => {
        if (!req.query.code) {
            return res.status(400).end("Invalid Code");
        }
        if (!req.query.guild_id) {
            return res.status(400).end("Invalid Guild ID");
        }
        const ex = await getClient().rest.oauth.exchangeCode({
            clientID:     Config.clientID,
            clientSecret: Config.clientSecret,
            code:         req.query.code,
            redirectURI:  Config.inviteRedirectURI
        }).catch(() => null);
        let user: string | null = null;
        if (ex !== null) {
            user = (await getClient().rest.oauth.getHelper(`${ex.tokenType} ${ex.accessToken}`).getCurrentUser()).id;
        }
        await db.redis.incr("invites");
        let source: string | null = null;
        try {
            source = (JSON.parse(Buffer.from(req.query.state, "base64").toString()) as { d: number; s: string; }).s;
            await db.redis.incr(`invites:bySource:${source}`);
        } catch {
            // ignore
        }
        await db.redis.setex(`invites:${req.query.guild_id}`, JSON.stringify({
            user,
            source,
            permissions: req.query.permissions
        }), 15);
        return res.status(200).render("invite-done", { prefix: "/" });
    });

app.route("/:link")
    .get(async(req,res) => {
        switch (req.params.link) {
            case "support": {
                return res.redirect(Config.discordLink);
            }
            case "privacy": {
                return res.redirect(Config.privacyPolicyLink);
            }
            case "invite": {
                return res.redirect(OAuthHelper.constructURL({
                    clientID:           Config.clientID,
                    disableGuildSelect: false,
                    guildID:            req.query.guild === undefined ? undefined : String(req.query.guild),
                    permissions:        String(Config.invitePermissions),
                    prompt:             "consent",
                    redirectURI:        Config.inviteRedirectURI,
                    responseType:       "code",
                    scopes:             [OAuthScopes.BOT, OAuthScopes.APPLICATIONS_COMMANDS, OAuthScopes.IDENTIFY],
                    state:              String(req.query.state ?? "eyJkIjoxNjc2ODEzNTMxNjA5LCJzIjoiYm90In0")
                }));
            }
            case "dev": {
                return res.redirect(Config.devLink);
            }
            case "twitter": {
                return res.redirect(Config.twitterLink);
            }
            case "donation": case "kofi": {
                return res.redirect(Config.donationLink);
            }
        }
        return res.status(404).end("Invalid Link");
    });

export default app;
