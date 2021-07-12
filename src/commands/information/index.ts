import config from "@config";
import Category from "@cmd/Category";

export default new Category("information", __filename)
	.setDisplayName("Information", config.emojis.default.info, null)
	.setDescription("Get some information..");
