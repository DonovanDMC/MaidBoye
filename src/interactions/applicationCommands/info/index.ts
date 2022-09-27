import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("information", import.meta.url)
    .setDisplayName("Information", Config.emojis.default.info)
    .setDescription("Get some information..");
