import { apiKeys, beta, userAgent } from "@config";
import E6 from "e621";

if (beta) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const E621 = new E6(apiKeys.e621.username, apiKeys.e621.key, [], userAgent, true);
export default E621;
