import BooleanSetting, { Type } from "./structure/GenericBoolean.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Config from "../../config/index.js";

export default class DisableSnipesSetting extends BooleanSetting {
    description = "if snipe/editsnipe should be disabled";
    emoji = Config.emojis.default.pencil;
    emojiType = "default" as const;
    name = "Disable Snipes";
    constructor() {
        super(Type.YES_NO, "SNIPE_DISABLED");
    }

    override getValue(gConfig: GuildConfig) {
        return gConfig.settings.snipeDisabled;
    }
}
