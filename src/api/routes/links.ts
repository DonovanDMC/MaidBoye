import Route from "../Route";
import {
	supportLink,
	websiteLink,
	devLink,
	twitterLink,
	kofiLink,
	permissionsNum,
	clientInfo,
	oAuthRedirectURI,
	oAuthScopes
} from "@config";


export default class LinksRoute extends Route {
	constructor() {
		super("/links");

		this.app
			.get("/invite/done", async(req,res) => res.status(200).render("invite-done"))
			.get("/invite/done-lite", async(req,res) => res.status(200).render("invite-done-lite"))
			.get("/:link", async(req,res, next) => {
				const link =
					req.params.link === "support" ? supportLink :
						req.params.link === "website" ? websiteLink :
							req.params.link === "dev" ? devLink :
								req.params.link === "twitter" ? twitterLink :
									req.params.link === "kofi" ? kofiLink :
										null;
				if (link !== null) return res.redirect(link);
				else return next();
			})
			.get("/invite", async(req,res) => res.redirect(`https://discord.com/oauth2/authorize?client_id=${clientInfo.id}&permissions=${permissionsNum}&redirect_uri=${encodeURIComponent(oAuthRedirectURI)}&response_type=code&scope=${oAuthScopes.join("%20")}`));
	}
}
