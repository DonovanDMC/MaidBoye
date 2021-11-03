import type Route from "./Route";
import type MaidBoye from "@MaidBoye";
import Logger from "@util/Logger";
import {
	antiSpamDir,
	apiCookieSecrets,
	apiIP,
	apiOptions,
	apiPort,
	apiSecure,
	apiURL,
	assetsDir,
	baseDir,
	errorsDir
} from "@config";
import express from "express";
import session from "express-session";
import morgan from "morgan";
import * as fs from "fs-extra";
import * as http from "http";
import * as https from "https";

export default class API {
	static server: http.Server | https.Server | null = null;
	static app: express.Express;
	static async launch(client: MaidBoye) {
		this.app = express()
			.set("trust proxy", true)
			.set("views", [`${baseDir}/src/api/templates`])
			.set("view engine", "ejs")
			.use("/errors/:id", async(req, res) => {
				if (!fs.existsSync(`${errorsDir}/${req.params.id}`)) return res.status(404).end("not found");
				else return res.status(200).header("Content-Type", "text/plain").sendFile(`${errorsDir}/${req.params.id}`);
			})
			.use("/reports/:user/:id", async(req, res) => {
				if (!fs.existsSync(`${antiSpamDir}/${req.params.user}/${req.params.id}`)) return res.status(404).end("not found");
				else return res.status(200).header("Content-Type", "text/plain").sendFile(`${antiSpamDir}/${req.params.user}/${req.params.id}`);
			})
			.use("/assets", express.static(assetsDir))
			.use(morgan("combined"))
			.use(express.json())
			.use(express.urlencoded({ extended: true }))
			.use(session({
				secret: apiCookieSecrets,
				name: "maid-boye",
				resave: true,
				saveUninitialized: false,
				cookie: {
					maxAge: 2.628e+9,
					signed: true,
					httpOnly: true,
					path: "/",
					secure: true,
					sameSite: "strict"
				}
			}));
		fs.readdirSync(`${__dirname}/routes`).forEach(p => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires, no-shadow
			const { default: v } = require(`${__dirname}/routes/${p}`) as { default: new(client: MaidBoye) => Route; };
			const r = new v(client);
			this.app.use(r.path, r.app);
		});

		// @TODO listener tests & retries
		(apiSecure ? https : http).createServer(apiOptions, this.app).listen(apiPort, apiIP);
		Logger.getLogger("API").info(`Now Listening on ${apiURL} (${apiIP}:${apiPort})`);
	}
}
