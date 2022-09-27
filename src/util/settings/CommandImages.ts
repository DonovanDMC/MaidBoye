import BooleanSetting, { Type } from "./structure/GenericBoolean.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Config from "../../config/index.js";

export default class CommandImagesSetting extends BooleanSetting {
    description = "if we should display images on some `fun` commands";
    emoji = Config.emojis.shared.thumbnail;
    emojiType = "custom" as const;
    name = "Command Images";
    constructor() {
        super(Type.ENABLED_DISABLED, "COMMAND_IMAGES");
    }

    override getValue(gConfig: GuildConfig) {
        return gConfig.settings.commandImages;
    }
}
