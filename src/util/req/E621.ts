import { apiKeys, beta, userAgent } from "@config";
import E6 from "e621";

if (beta) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const E621 = new E6({
	authUser: apiKeys.e621.username,
	authKey: apiKeys.e621.key,
	userAgent
});
export const YiffyV3 = new E6({
	authUser: apiKeys.yiffy_v3.username,
	authKey: apiKeys.yiffy_v3.key,
	userAgent,
	instanceHost: "yiff.rest",
	instancePort: 443,
	instanceSSL: true
});
export default E621;
