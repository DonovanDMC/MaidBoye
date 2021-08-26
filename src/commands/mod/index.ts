import { emojis } from "@config";
import Category from "@cmd/Category";

export default new Category("mod", __filename)
	.setDisplayName("Moderation", emojis.default.mod, emojis.custom.mod)
	.setDescription("Some moderation utilities for your server");
