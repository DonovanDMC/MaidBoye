import path from "path";
import moduleAlias from "module-alias";
import sauce from "source-map-support";
import { Context } from "telegraf";
import { Update } from "typegram";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";
const d = path.resolve(`${__dirname}/../../`);
moduleAlias.addAliases({
	"@root": d,
	"@config": `${d}/src/config`,
	"@util": `${d}/src/util`
});
sauce.install({ hookRequire: true });

const o = Context.prototype.reply;
Context.prototype.reply = async function(this: Context<Update>, text: string, extra?: ExtraReplyMessage) {
	return o.call(this, text, {
		reply_to_message_id: this.message?.message_id,
		parse_mode: "MarkdownV2",
		...(extra ?? {})
	});
}
