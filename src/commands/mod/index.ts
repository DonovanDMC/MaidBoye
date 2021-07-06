import config from "../../config";
import Category from "../../util/cmd/Category";

export default new Category("mod", __filename)
	.setDisplayName("Moderation", config.emojis.default.mod, config.emojis.custom.mod)
	.setDescription("Some moderation utilities for your server");
