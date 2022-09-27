import BooleanSetting, { Type } from "./structure/GenericBoolean.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import Config from "../../config/index.js";

export default class LevelUpAnnouncementsSetting extends BooleanSetting {
    description = "if level ups should be announced (in channel)";
    emoji = Config.emojis.default.tada;
    emojiType = "default" as const;
    name = "Level Up Announcements";
    constructor() {
        super(Type.YES_NO, "ANNOUNCE_LEVEL_UP");
    }

    override getValue(gConfig: GuildConfig) {
        return gConfig.settings.announceLevelUp;
    }
}
