import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("util", import.meta.url)
    .setDisplayName("Utility", Config.emojis.default.utility)
    .setDescription("Some utilities for your server");
