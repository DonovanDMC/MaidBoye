import MaidBoye from "../../main";
import Route from "../Route";
import config from "@config";


export default class LinksRoute extends Route {
	constructor(client: MaidBoye) {
		super("/links");

		this.app
			.get("/invite/done", async(req,res) => res.status(200).send("").end())
			.get("/:link", async(req,res, next) => {
				if (config.client.links[req.params.link as "support"]) return res.redirect(config.client.links[req.params.link as "support"]);
				else return next();
			})
			.get("/invite", async(req,res) => res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.client.id}&permissions=${config.client.permissions.integer}&redirect_uri=${encodeURIComponent(config.client.oAuth.redirectURI)}&response_type=code&scope=${config.client.oAuth.scope.join("%20")}`));
	}
}
