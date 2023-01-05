import Config from "../../config/index.js";
import YiffyAPI from "yiffy";
import debug from "debug";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
debug.enable("yiffy:*");
const Yiffy = new YiffyAPI({
    userAgent: Config.userAgent,
    apiKey:    Config.yiffyAPIKey
});

export default Yiffy;
