import { emojis } from "@config";
import Category from "@cmd/Category";

export default new Category("miscellaneous", __filename)
	.setDisplayName("Miscellaneous", emojis.default.misc, null)
	.setDescription("Some miscellaneous things I have");
