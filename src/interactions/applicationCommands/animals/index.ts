import Config from "../../../config/index.js";
import Util from "../../../util/Util.js";
import Category from "../../../util/cmd/Category.js";

export default new Category("animals", import.meta.url)
    .setDisplayName("Animals", Config.emojis.default.animals)
    .setDescription("Get some pictures of cute animals uwu")
    .addGenericCommands(Util.genericImageCommandExpander, {
        birb:   "Get an image of a birb!",
        bunny:  "Get an image of a bunny!",
        cat:    "Get an image of a cat!",
        dikdik: "Get an image of a dikdik!",
        dog:    "Get an image of a dog!",
        duck:   "Get an image of a duck!",
        fox:    "Get an image of a fox!",
        koala:  "Get an image of a koala!",
        otter:  "Get an image of a otter!",
        owl:    "Get an image of a owl!",
        panda:  "Get an image of a panda!",
        snek:   "Get an image of a snake!",
        turtle: "Get an image of a turtle!",
        wah:    "Get an image of a red panda!",
        wolf:   "Get an image of a wolf!"
    });
