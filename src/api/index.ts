import Route from "./Route";
import config from "../config";
import Logger from "../util/Logger";
import MaidBoye from "../main";
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
			.use("/errors", express.static(config.dir.logs.errors))
			.use("/assets", express.static(config.dir.assets))
			.use(morgan("combined"))
			.use(express.json())
			.use(express.urlencoded({ extended: true }))
			.use(session({
				secret: config.api.cookieSecret,
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
		(config.api.listener.secure ? https : http).createServer(config.api.listener.options, this.app).listen(config.api.listener.port, config.api.listener.ip);
		Logger.getLogger("API").info(`Now Listening on ${config.api.url} (${config.api.listener.ip}:${config.api.listener.port})`);
	}
}
