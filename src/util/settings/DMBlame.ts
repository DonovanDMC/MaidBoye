import BooleanSetting, { Type } from "./structure/GenericBoolean.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Config from "../../config/index.js";

export default class DMBlameSetting extends BooleanSetting {
    description = "if who performed the action should be said in punishment dms";
    emoji = Config.emojis.default.tada;
    emojiType = "default" as const;
    name = "DM Blame";
    constructor() {
        super(Type.ENABLED_DISABLED, "DM_BLAME");
    }

    override get shortDescription() {
        return "if who performed the action should be said in dms";
    }

    override getValue(gConfig: GuildConfig) {
        return gConfig.settings.announceLevelUp;
    }
}
