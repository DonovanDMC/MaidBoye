import { emojis } from "@config";
import Category from "@cmd/Category";

export default new Category("utility", __filename)
	.setDisplayName("Utility", emojis.default.utility)
	.setDescription("Some utilities for your server");
