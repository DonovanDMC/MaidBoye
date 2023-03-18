/// <reference path="../util/@types/express.d.ts" />
import Config from "../config/index.js";
import StatsHandler from "../util/StatsHandler.js";
import Logger from "@uwu-codes/logger";
import express from "express";
import session from "express-session";
import ehb from "express-handlebars";
import morgan from "morgan";

export const hbs = ehb.create({
    extname:       "hbs",
    defaultLayout: "default",
    layoutsDir:    `${Config.baseDir}/src/api/views/layouts`,
    partialsDir:   `${Config.baseDir}/src/api/views/partials`
});
const app = express()
    .engine("hbs", hbs.engine)
    .set("view engine", "hbs")
    .set("views", `${Config.baseDir}/src/api/views/pages`)
    .set("view options", { pretty: true })
    .set("trust proxy", true)
    .set("x-powered-by", false)
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(session({
        name:   "maid",
        secret: Config.cookieSecret,
        cookie: {
            maxAge:   8.64e7,
            secure:   true,
            httpOnly: true,
            domain:   /(?:\d+\.){3}\d+/.test(Config.apiHost) ? Config.apiHost : `.${Config.apiHost}`
        },
        resave:            false,
        saveUninitialized: true
    }))
    .use(morgan("dev"))
    .use(async(req, res, next) => {
        req.data ??= {};
        res.header({
            "Referrer-Policy":  "no-referrer-when-downgrade",
            "X-XSS-Protection": [
                "1",
                "mode=block",
                "report=https://yiff.report-uri.com/r/d/xss/enforce"
            ].join("; "),
            "Access-Control-Allow-Headers": [
                "Content-Type",
                "Authorization"
            ].join(", "),
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Methods": [
                "GET",
                "POST",
                "OPTIONS",
                "HEAD"
            ].join(", "),
            "X-Frame-Options": "DENY",
            "Cache-Control":   "no-cache",
            "X-Powered-By":    ["Yiff", "Large Knots", "Bottomless Foxes"][Math.floor(Math.random() * 3)]
        });
        return next();
    })
    .get("/online", async (req, res) => res.status(200).json({
        success: true,
        uptime:  process.uptime()
    }))
    .get("/session", async(req, res) => res.status(200).json({ id: StatsHandler.SessionID }))
    .use("/features", (await import("./routes/features.js")).default)
    .use("/leveling", (await import("./routes/leveling.js")).default)
    .use("/welcome", (await import("./routes/welcome.js")).default)
    .use("/links", (await import("./routes/links.js")).default)
    .use("/bulk-delete", (await import("./routes/bulkDelete.js")).default)
// last 3 param handler = 404, 4 param handler = error
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    .use(async (req, res, next) => res.status(404).end("Not Found"))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    .use(async (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        Logger.getLogger("API").error(err);
        return res.status(500).end("Internal Server Error");
    });

export default app;
