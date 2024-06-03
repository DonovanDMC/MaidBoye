import Config from "../../config/index.js";
import CheweyBotAPI from "cheweyapi";
const CheweyAPI = new CheweyBotAPI(Config.cheweyAPIKey, Config.userAgent);

export default CheweyAPI;
