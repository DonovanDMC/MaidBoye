import Logger from "../Logger";
import { userAgent, apiKeys } from "@config";
import YiffyAPI from "yiffy";

const Yiffy = new YiffyAPI({
	userAgent,
	apiKey: apiKeys.yiffy,
	debug: (url, { time }) => Logger.getLogger("YiffyAPI").info(`API request for "${url}" took ${time}ms`)
});

export default Yiffy;
