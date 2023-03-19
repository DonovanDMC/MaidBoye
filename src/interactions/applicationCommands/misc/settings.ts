import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Settings from "../../../util/settings/index.js";

export default new Command(import.meta.url, "settings")
    .setDescription("Manage this server's settings.")
    .setOptionsGetter(() => Settings.getOptions())
    .setPermissions("user", "MANAGE_GUILD")
    .setAck("ephemeral")
    .setValidLocation(ValidLocation.GUILD)
    .setGuildLookup(true)
    .setExecutor(async function(interaction, options, gConfig) {
        return Settings.handleInteraction(interaction, gConfig);
    });
