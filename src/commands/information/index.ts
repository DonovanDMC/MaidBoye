import Category from "@cmd/Category";
import { emojis } from "@config";

export default new Category("information", __filename)
	.setDisplayName("Information", emojis.default.info, null)
	.setDescription("Get some information..");
