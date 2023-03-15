import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("nsfw", import.meta.url)
    .setDisplayName("NSFW", Config.emojis.default.nsfw)
    .setDescription("Th-the things your parents warned you about.. nwn")
    .addGenericCommands(Util.genericImageCommandExpander, {
        bulge:       cmd => cmd.setDescription("Bolgy wolgy uwu").setRestrictions("nsfw"),
        fursuitbutt: cmd => cmd.setDescription("Get an image of a fursuit butt 👀").setRestrictions("nsfw")
    });
