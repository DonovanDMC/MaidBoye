import BooleanPreference, { Type } from "./structure/GenericBoolean.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";

export default class DisableSnipesPreference extends BooleanPreference {
    description = "Disable sniping your edited/deleted messasges. If you enable this, you cannot snipe others messages.";
    emoji = Config.emojis.default.pencil;
    emojiType = "default" as const;
    name = "Disable Snipes";
    constructor() {
        super(Type.YES_NO, "DISABLE_SNIPES");
    }

    override get shortDescription() {
        return "Disable sniping your edited/deleted messasges.";
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.disableSnipes;
    }
}
