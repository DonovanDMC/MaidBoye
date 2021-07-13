import config from "@config";
import Category from "@cmd/Category";

export default new Category("nsfw", __filename)
	.setDisplayName("NSFW", config.emojis.default.nsfw, null)
	.setDescription("Th-the things your parents warned you about.. nwn");
