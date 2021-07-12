import config from "@config";
import Category from "@cmd/Category";

export default new Category("dev", __filename)
	.setDisplayName("Development", config.emojis.default.dev, config.emojis.custom.dev)
	.setDescription("S-some tools for my creators..")
	.setRestrictions("developer");
