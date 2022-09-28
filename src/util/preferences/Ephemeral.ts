import BooleanPreference, { Type } from "./structure/GenericBoolean.js";
import type UserConfig from "../../db/Models/UserConfig.js";
import Config from "../../config/index.js";

export default class EphemeralPreference extends BooleanPreference {
    description = "Make most command responses sent to you ephemeral (only visible to you).";
    emoji = Config.emojis.preferences.ephemeral;
    emojiType = "custom" as const;
    name = "Ephemeral";
    constructor() {
        super(Type.ENABLED_DISABLED, "EPHEMERAL");
    }

    override get shortDescription() {
        return "Make most command responses sent to you ephemeral.";
    }

    override getValue(uConfig: UserConfig) {
        return uConfig.preferences.ephemeral;
    }
}
