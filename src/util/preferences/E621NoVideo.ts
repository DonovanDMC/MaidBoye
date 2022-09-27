import BooleanPreference, { Type } from "./structure/GenericBoolean.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";

export default class E621NoVideoPreference extends BooleanPreference {
    description = "Hide video posts in the e621 command";
    emoji = Config.emojis.shared.gif;
    emojiType = "custom" as const;
    name = "E621 No Video";
    constructor() {
        super(Type.ENABLED_DISABLED, "E621_NO_VIDEO");
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.e621NoVideo;
    }
}
