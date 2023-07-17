import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import Util from "../../../util/Util.js";
import { Colors, lockPermissions, lockPermissionsList } from "../../../util/Constants.js";
import db from "../../../db/index.js";
import { Strings } from "@uwu-codes/utils";
import { type AnyTextableGuildChannelWithoutThreads, ApplicationCommandOptionTypes, OverwriteTypes, TextableGuildChannelsWithoutThreadsTypes } from "oceanic.js";

export default new Command(import.meta.url, "lock")
    .setDescription("Block messages in a channel..")
    .setPermissions("user", "MANAGE_CHANNELS")
    .setPermissions("bot", "MANAGE_CHANNELS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
            .setDescription("The channel to lock (default: current channel)")
            .setChannelTypes(TextableGuildChannelsWithoutThreadsTypes)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for locking the channel")
            .setMinMax(1, 500)
    )
    .setOptionsParser(interaction => ({
        channel: interaction.data.options.getCompleteChannel<AnyTextableGuildChannelWithoutThreads>("channel", true),
        reason:  interaction.data.options.getString("reason") || "None Provided"
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { channel, reason }, gConfig) {
        reason = Strings.truncateWords(reason, 500);
        const overwrite = channel.permissionOverwrites.get(interaction.guildID);
        let allow = 0n, deny = 0n;
        if (overwrite) {
            allow = overwrite.allow;
            deny = overwrite.deny;
            // only yell at the user if all permissions have been denied already
            if (overwrite.deny & lockPermissions) {
                return interaction.reply({ content: `H-hey! ${channel.id === interaction.channelID ? "This" : "That"} channel is already locked..` });
            }
            await db.redis.set(`lock:${interaction.channel.id}`, JSON.stringify([overwrite.allow.toString(), overwrite.deny.toString()]));
            for (const perm of lockPermissionsList) {
                if (allow & perm) {
                    allow &= ~perm;
                }
            }
        }

        await channel.editPermission(interaction.guildID, {
            allow,
            deny:   deny | lockPermissions,
            reason: `Lock: ${interaction.user.tag} (${interaction.user.id}) -> ${reason ?? "None Provided"}`,
            type:   OverwriteTypes.ROLE
        });
        const { caseID } = await ModLogHandler.createEntry({
            type:   ModLogType.LOCK,
            guild:  interaction.guild,
            gConfig,
            blame:  interaction.member,
            reason,
            target: channel
        });
        await interaction.reply({ content: `<#${channel.id}> has been locked (case #${caseID})\n\nNote: Members with the **administrator** permission, and any roles or members that have \`Send Messages\` ticked on in the permission overwrites will still be able to send messages.` });
        await channel.createMessage({
            embeds: Util.makeEmbed(true, interaction.user)
                .setTitle("Channel Locked")
                .setDescription(`This channel has been locked by <@!${interaction.user.id}>\nReason: ${reason}`)
                .setColor(Colors.gold)
                .toJSON(true)
        });
    });
