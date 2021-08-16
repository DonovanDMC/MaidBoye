import path from "path";
import moduleAlias from "module-alias";
import sauce from "source-map-support";
const d = path.resolve(`${__dirname}/../`);
moduleAlias.addAliases({
	"@root": d,
	"@config": `${d}/src/config`
});
sauce.install({ hookRequire: true });
import MaidBoye from "./main";

const bot = new MaidBoye();

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))

void bot.loadCommands()
	.then(() => bot.launch());

export default bot;
