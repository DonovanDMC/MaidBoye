import Config from "../../config/index.js";
import { ImageGenAPI } from "imgen";

const ImageGen = new ImageGenAPI({
    apiKey:    Config.imgenAPIKey,
    userAgent: Config.userAgent
});
export default ImageGen;
