/* eslint-disable unused-imports/no-unused-imports */
import db from "../db/index.js";
import Autocomplete from "../interactions/autocomplete/index.js";
import ClientEvent from "../util/ClientEvent.js";
import Components from "../interactions/components/index.js";
import Logger from "../util/Logger.js";
import Preferences from "../util/preferences/index.js";
import Settings from "../util/settings/index.js";
import ModLogHandler from "../util/handlers/ModLogHandler.js";
import TimedModerationHandler from "../util/handlers/TimedModerationHandler.js";
import StatsHandler from "../util/StatsHandler.js";
import Config from "../config/index.js";
import Modals from "../interactions/modals/index.js";
import WebhookFailureHandler from "../util/handlers/LoggingWebhookFailureHandler.js";
import AutoPostingService from "../services/AutoPosting.js";
import FurryBotStatusService from "../services/FurryBotStatus.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("ready", async function readyEvent() {
    if (this.firstReady === true) {
        return Logger.getLogger("Ready").warn("Ready event called after first ready, ignoring.");
    }
    this.firstReady = true;
    await db.initIfNotReady();
    await Settings.loadAll();
    await Preferences.loadAll();
    await Components.loadAll();
    await Modals.loadAll();
    await Autocomplete.loadAll();
    await ModLogHandler.init(this);
    await TimedModerationHandler.init(this);
    await this.registerCommands();
    await this.startAPIServer();
    await WebhookFailureHandler.init(this);
    this.readyTime = process.hrtime.bigint();
    this.presenceUpdateInterval = setInterval(async() => {
        const presence = Config.getPresence();
        if (presence) {
            await this.editStatus(presence.status, presence.activities);
        }
    }, 1e3);
    await AutoPostingService.register();
    await FurryBotStatusService.register();
    Logger.info(`Ready as ${this.user.username}#${this.user.discriminator} in ${Time.ms((this.readyTime - this.initTime) / 1000000n, { words: true, ms: true, shortMS: true })}`);
    StatsHandler.track("READY");
});
