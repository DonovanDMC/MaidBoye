import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("mod", import.meta.url)
    .setDisplayName("Moderation", Config.emojis.default.mod, Config.emojis.custom.mod)
    .setDescription("Some moderation utilities for your server");
