import Logger from "../Logger.js";
import Config from "../../config/index.js";
import YiffyAPI from "yiffy";

const Yiffy = new YiffyAPI({
    userAgent: Config.userAgent,
    apiKey:    Config.yiffyAPIKey,
    debug:     (url, { time }) => Logger.getLogger("YiffyAPI").info(`API request for "${url}" took ${time}ms`)
});

export default Yiffy;
