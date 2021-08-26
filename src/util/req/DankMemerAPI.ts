import { apiKeys, userAgent } from "@config";
import DMAPI from "dankmemerapi";
const DankMemerAPI = new DMAPI({
	apiKey: apiKeys.dankMemer,
	userAgent,
	cacheRequests: false,
	timeout: 6e4
});

export default DankMemerAPI;
