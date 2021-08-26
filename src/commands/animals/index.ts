import Category from "@cmd/Category";
import { emojis } from "@config";

export default new Category("animals", __filename)
	.setDisplayName("Animals", emojis.default.animals, null)
	.setDescription("Get some pictures of cute animals uwu");
