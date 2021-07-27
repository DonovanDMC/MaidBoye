import config from "@config";
import Category from "@cmd/Category";

export default new Category("animals", __filename)
	.setDisplayName("animals", config.emojis.default.animals, null)
	.setDescription("Get some pictures of cute animals uwu");
