import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("fun", import.meta.url)
    .setDisplayName("Fun", Config.emojis.default.fun)
    .setDescription("Some fun stuff for you and your friends");
