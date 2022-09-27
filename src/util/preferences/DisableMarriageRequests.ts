import BooleanPreference, { Type } from "./structure/GenericBoolean.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";

export default class DisableMarriageRequestsPreference extends BooleanPreference {
    description = "Disable people requesting to marry you. You can still send marriage requests.";
    emoji = Config.emojis.default.pencil;
    emojiType = "default" as const;
    name = "Disable Marriage Requests";
    constructor() {
        super(Type.YES_NO, "DISABLE_MARRIAGE_REQUESTS");
    }

    override get shortDescription() {
        return "Disable people requesting to marry you.";

    }
    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.disableMarriageRequests;
    }
}
