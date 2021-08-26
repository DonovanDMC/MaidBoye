import Category from "@cmd/Category";
import { emojis } from "@config";

export default new Category("dev", __filename)
	.setDisplayName("Development", emojis.default.dev, emojis.custom.dev)
	.setDescription("S-some tools for my creators..")
	.setRestrictions("developer");
