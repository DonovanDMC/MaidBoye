import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Preferences from "../../../util/preferences/index.js";

export default new Command(import.meta.url, "preferences")
    .setDescription("Manage your user preferences.")
    .setOptionsGetter(() => Preferences.getOptions())
    .setAck("ephemeral")
    .setValidLocation(ValidLocation.BOTH)
    .setUserLookup(true)
    .setExecutor(async function(interaction, options, gConfig, uConfig) {
        return Preferences.handleInteraction(interaction, uConfig);
    });
