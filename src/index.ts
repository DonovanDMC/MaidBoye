import "./util/MonkeyPatch";
import MaidBoye from "./main";

const bot = new MaidBoye();

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))

void bot.launch();

export default bot;
