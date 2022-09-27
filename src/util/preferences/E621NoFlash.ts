import BooleanPreference, { Type } from "./structure/GenericBoolean.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";

export default class E621NoFlashPreference extends BooleanPreference {
    description = "Hide flash posts in the e621 command";
    emoji = Config.emojis.shared.gif;
    emojiType = "custom" as const;
    name = "E621 No Flash";
    constructor() {
        super(Type.ENABLED_DISABLED, "E621_NO_FLASH");
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.e621NoFlash;
    }
}
