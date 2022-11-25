import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { GuildScheduledEvent, User } from "oceanic.js";

export default new ClientEvent("guildScheduledEventUserAdd", async function guildScheduledEventUserAddEvent(event, user) {
    if (!(event instanceof GuildScheduledEvent)) {
        return;
    }
    const events = await LogEvent.getType(event.guildID, LogEvents.SCHEDULED_EVENT_USER_ADD);
    if (events.length === 0) {
        return;
    }

    if (!(user instanceof User)) {
        user = (await this.getUser(user.id))!;
    }
    const embed = Util.makeEmbed(true)
        .setTitle("Scheduled Event User Added")
        .setColor(Colors.green)
        .setDescription([
            `Event: **${event.name}** (${event.id})`,
            `User: **${(user as User).tag}** (${user.id})`
        ]);

    for (const log of events) {
        await log.execute(this, { embeds: embed.toJSON(true) });
    }
});
