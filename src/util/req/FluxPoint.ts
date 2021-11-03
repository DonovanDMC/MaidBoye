import { apiKeys, userAgent } from "@config";
import { FluxPointAPI } from "fluxpointapi";

const FluxPoint = new FluxPointAPI(apiKeys.fluxpoint, userAgent);
export default FluxPoint;
