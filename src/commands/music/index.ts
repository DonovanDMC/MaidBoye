import config from "@config";
import Category from "@cmd/Category";

export default new Category("music", __filename)
	.setDisplayName("Music", config.emojis.default.music, null)
	.setDescription("Play some music in your server!")
	.setRestrictions("disabled");
