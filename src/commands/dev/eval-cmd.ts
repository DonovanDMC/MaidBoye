import db from "../../db";
import config from "@config";
import Command from "@cmd/Command";
import Logger from "@util/Logger";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import Eris from "eris";
import { Internal, Request, Strings, Time, Utility, Redis } from "@uwu-codes/utils";
import Timer from "@util/Timer";
import util from "util";

async function format(obj: unknown) {
	if (obj instanceof Promise) obj = await obj;
	if (Array.isArray(obj)) return JSON.stringify(obj);
	if (typeof obj === "object" && obj !== null) {
		if (obj.constructor && typeof Eris[obj.constructor.name as "Client"] !== "undefined" && !["DiscordRESTError"].includes(obj.constructor.name)) {
			let str = `<${obj.constructor.name}`;
			for (const k in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					// skip underscore properties
					if (k.startsWith("_")) return;
					// eslint-disable-next-line
					str += ` ${k}=${await format((obj as Record<string, any>)[k])}`;
				}
			}
			return `${str}>`;
		} else {
			try {
				return JSON.stringify(obj, undefined, "\t");
			} catch (_) {
				return Object.prototype.toString.call(obj);
			}
		}
	} else return obj;
}

// @TODO >2000 characters to text
export default new Command("eval", "ev")
	.setRestrictions("developer")
	.setDescription("Evaluate some code.")
	.setUsage("<code>")
	.setParsedFlags("d", "delete", "s", "silent")
	.setExecutor(async function(msg) {
		const evalVariables: Record<string, unknown> = {
			Eris,
			db,
			Internal,
			Request,
			Strings,
			Time,
			Utility,
			Redis
		};
		// eslint-disable-next-line -- typescript messes with variable names so we have to remake them
		for (const k in evalVariables) new Function("value", `${k} = value`)(evalVariables[k]);
		let res: unknown;
		const start = Timer.start();
		try {
			const ev = msg.rawArgs.join(" ");
			// eslint-disable-next-line no-eval
			res = await eval(`(async()=>{${ev.indexOf("return") === -1 ? "return " : ""}${ev}})()`);
		} catch (err) {
			res = err;
		}
		const end = Timer.end();

		const f = await format(res);

		if (res instanceof Error) Logger.getLogger("Eval").error("Eval Error:", res);
		if (msg.dashedArgs.value.includes("delete") || msg.dashedArgs.value.includes("d")) await msg.delete().catch(() => null);
		if (!(msg.dashedArgs.value.includes("silent") || msg.dashedArgs.value.includes("s"))) {
			let file: string | undefined, out = String((msg.dashedArgs.value.includes("raw") || msg.dashedArgs.value.includes("r")) ? res : f);
			if (out.length >= 750) {
				try {
					file = util.inspect(JSON.parse(out), { depth: 1 });
				} catch (e) {
					file = out;
				}
				out = "see attached file";
			}

			// @TODO ms/μs/ns
			const t = Timer.calc(start, end, 3, false);
			return msg.reply({
				embeds: [
					new EmbedBuilder()
						.setAuthor(msg.author.tag, msg.author.avatarURL)
						.setTitle(`Time Taken: ${t.val}ms`)
						.setColor(res instanceof Error ? "red" : "green")
						.addField(`${config.emojis.default.in} Code`, `\`\`\`js\n${msg.args.join(" ").slice(0, 300)}\`\`\``, false)
						.addField(`${config.emojis.default.out}`, `\`\`\`js\n${out}\`\`\``, false)
						.toJSON()
				],
				components: new ComponentHelper()
				/* .addRow()
					.addInteractionButton(ComponentHelper.BUTTON_DANGER, "eval.trash", false, ComponentHelper.emojiToPartial(config.emojis.default.trash, "default"), "Delete Response")
					.addRow()
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `eval.delete.${msg.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"), "Delete Invocation") */

					.addInteractionButton(ComponentHelper.BUTTON_DANGER, "eval.trash", false, ComponentHelper.emojiToPartial(config.emojis.default.trash, "default"))
					.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `eval.delete.${msg.id}`, false, ComponentHelper.emojiToPartial(config.emojis.default.x, "default"))
					.toJSON()
			}, file === undefined ? undefined : {
				file,
				name: "output.txt"
			});
		} else {
			Logger.getLogger("Eval").info("Silent Eval Return (formatted):", f);
			Logger.getLogger("Eval").info("Silent Eval Return (raw):", res);
		}
	});
