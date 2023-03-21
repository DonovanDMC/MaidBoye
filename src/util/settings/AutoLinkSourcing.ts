import BooleanSetting, { Type } from "./structure/GenericBoolean.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Config from "../../config/index.js";

export default class AutoLinkSourcingSetting extends BooleanSetting {
    description = "if linked images should be auto sourced (includes non prefixed messages)";
    emoji = Config.emojis.default.tada;
    emojiType = "default" as const;
    name = "Auto Link Sourcing";
    constructor() {
        super(Type.ENABLED_DISABLED, "AUTO_SOURCING");
    }

    override get shortDescription() {
        return "if linked images should be auto sourced";
    }

    override getValue(gConfig: GuildConfig) {
        return gConfig.settings.autoSourcing;
    }
}
