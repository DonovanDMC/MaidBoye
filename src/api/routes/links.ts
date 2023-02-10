import Config from "../../config/index.js";
import { Router } from "express";
import { OAuthHelper, OAuthScopes } from "oceanic.js";

const app = Router();

app.route("/invite/done")
    .get(async(req,res) => res.status(200).render("invite-done"));

app.route("/invite/done-lite")
    .get(async(req,res) => res.status(200).render("invite-done-lite"));

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
                    state:              "you're gay"
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
