import config from "../../config";
import Category from "../../util/cmd/Category";

export default new Category("miscellaneous", __filename)
	.setDisplayName("Miscellaneous", config.emojis.default.misc, null)
	.setDescription("Some miscellaneous things I have");
