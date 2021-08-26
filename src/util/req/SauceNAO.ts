import { apiKeys } from "@config";
import Sagiri from "sagiri";
const SauceNAO = Sagiri(apiKeys.saucenao, {
	mask: [28],
	results: 4
});
export default SauceNAO;
