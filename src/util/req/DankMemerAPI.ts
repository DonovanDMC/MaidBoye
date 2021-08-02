import config from "@config";
import DMAPI from "dankmemerapi";
const DankMemerAPI = new DMAPI({
	apiKey: config.apiKeys.dankMemer,
	userAgent: config.userAgent,
	cacheRequests: false,
	timeout: 6e4
});

export default DankMemerAPI;
