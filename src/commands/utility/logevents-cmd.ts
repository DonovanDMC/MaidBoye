import Command from "@cmd/Command";
import Eris from "eris";
import db from "@db";
import EmbedBuilder from "@util/EmbedBuilder";
import BotFunctions from "@util/BotFunctions";
import { Strings } from "@uwu-codes/utils";
const Redis = db.r;

const types = [];
export default new Command("logevents", "logging")
	.setPermissions("bot", "embedLinks")
	.setPermissions("user", "manageGuild")
	.setDescription("Manage the logging for this server")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {
		// @FIXME
	});
