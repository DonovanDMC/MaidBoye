import config from "../../config";
import CheweyBotAPI from "cheweyapi";

const CheweyAPI = new CheweyBotAPI(config.apiKeys.cheweyBot, config.userAgent);

export default CheweyAPI;
