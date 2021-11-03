import { apiKeys, userAgent } from "@config";
import CheweyBotAPI from "cheweyapi";

const CheweyAPI = new CheweyBotAPI(apiKeys.cheweyBot, userAgent);

export default CheweyAPI;
