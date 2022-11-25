import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import { AnyThreadChannel, EmbedOptions, ThreadChannel } from "oceanic.js";

export default new ClientEvent("threadMembersUpdate", async function threadMembersUpdateEvent(thread, addedMembers, removedMembers) {
    const eventsAdd = await LogEvent.getType(thread.guildID, LogEvents.THREAD_MEMBER_ADD);
    const eventsRemove = await LogEvent.getType(thread.guildID, LogEvents.THREAD_MEMBER_REMOVE);
    if (eventsAdd.length === 0 && eventsRemove.length === 0) {
        return;
    }

    if (!(thread instanceof ThreadChannel)) {
        thread = await this.rest.channels.get<AnyThreadChannel>(thread.id);
    }
    if (eventsAdd.length !== 0 && addedMembers.length !== 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const { userID } of addedMembers) {
            const member = (await this.getMember(thread.guildID, userID))!;
            embeds.push(Util.makeEmbed(true)
                .setTitle("Thread Member Added")
                .setColor(Colors.green)
                .setDescription([
                    `Thread: ${(thread as AnyThreadChannel).name} (${thread.id})`,
                    `Member: **${member.tag}** (${member.id})`
                ])
                .toJSON()
            );
        }

        for (const log of eventsAdd) {
            await log.execute(this, { embeds });
        }
    }

    if (eventsRemove.length !== 0 && removedMembers.length !== 0) {
        const embeds: Array<EmbedOptions> = [];
        for (const { userID } of removedMembers) {
            const member = (await this.getMember(thread.guildID, userID))!;
            embeds.push(Util.makeEmbed(true)
                .setTitle("Thread Member Removed")
                .setColor(Colors.green)
                .setDescription([
                    `Thread: ${(thread as AnyThreadChannel).name} (${thread.id})`,
                    `Member: **${member.tag}** (${member.id})`
                ])
                .toJSON()
            );
        }

        for (const log of eventsAdd) {
            await log.execute(this, { embeds });
        }
    }
});
