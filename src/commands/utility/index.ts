import config from "../../config";
import Category from "../../util/cmd/Category";

export default new Category("utility", __filename)
	.setDisplayName("Utility", config.emojis.default.utility)
	.setDescription("Some utilities for your server");
