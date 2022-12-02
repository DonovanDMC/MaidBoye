import Config from "../../config/index.js";
import YiffyAPI from "yiffy";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Yiffy = new YiffyAPI({
    userAgent:        Config.userAgent,
    apiKey:           Config.yiffyAPIKey,
    baseURL:          "https://yiff-rest.websites.containers.local",
    host:             "v2.yiff.rest",
    thumbsBaseURL:    "https://yiff-rest.websites.containers.local",
    thumbsHost:       "thumbs.yiff.rest",
    shortenerBaseURL: "https://yiff-rocks.websites.containers.local",
    shortenerHost:    "yiff.rocks"
});

export default Yiffy;
