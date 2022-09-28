import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("miscellaneous", import.meta.url)
    .setDisplayName("Miscellaneous", Config.emojis.default.misc)
    .setDescription("Some miscellaneous things I have");
