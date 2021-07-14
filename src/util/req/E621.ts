import config from "@config";
import E6 from "e621";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const E621 = new E6(config.apiKeys.e621.username, config.apiKeys.e621.key, [], config.userAgent, true);
export default E621;
