import Config from "../../../config/index.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("animals", import.meta.url)
    .setDisplayName("Animals", Config.emojis.default.animals)
    .setDescription("Get some pictures of cute animals uwu");
