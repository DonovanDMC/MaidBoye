import config from "../../config";
import { FluxPointAPI } from "fluxpointapi";

const FluxPoint = new FluxPointAPI(config.apiKeys.fluxpoint, config.userAgent);
export default FluxPoint;
