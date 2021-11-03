import { emojis } from "@config";
import Category from "@cmd/Category";

export default new Category("fun", __filename)
	.setDisplayName("Fun", emojis.default.fun, null)
	.setDescription("Some fun stuff for you and your friends");
