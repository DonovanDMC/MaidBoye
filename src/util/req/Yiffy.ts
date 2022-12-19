import Config from "../../config/index.js";
import YiffyAPI from "yiffy";
import debug from "debug";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
debug.enable("yiffy:*");
const Yiffy = new YiffyAPI({
    userAgent:        Config.userAgent,
    apiKey:           Config.yiffyAPIKey,
    baseURL:          "https://yiff-rest.websites.local",
    host:             "v2.yiff.rest",
    thumbsBaseURL:    "https://yiff-rest.websites.local",
    thumbsHost:       "thumbs.yiff.rest",
    shortenerBaseURL: "https://yiff-rocks.websites.local",
    shortenerHost:    "yiff.rocks"
});

export default Yiffy;
