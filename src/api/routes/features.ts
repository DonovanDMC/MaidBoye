import { GuildFeatureDescriptions } from "../../util/Names.js";
import { Router } from "express";
import MarkdownIt from "markdown-it";
import type { GuildFeature } from "oceanic.js";
const md = new MarkdownIt();

const app = Router();

app.route("/:name")
    .get(async(req, res) => res.status(200).render("feature-description", { name: req.params.name, description: md.render(GuildFeatureDescriptions[req.params.name as GuildFeature] || `Unknown; "${req.params.name}"`) }));

export default app;
