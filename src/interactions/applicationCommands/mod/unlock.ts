import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { lockPermissions, lockPermissionsList, TextableGuildChannels } from "../../../util/Constants.js";
import db from "../../../db/index.js";
import { Strings } from "@uwu-codes/utils";
import { AnyGuildTextChannelWithoutThreads, ApplicationCommandOptionTypes, OverwriteTypes } from "oceanic.js";

export default new Command(import.meta.url, "unlock")
    .setDescription("Undo a lock")
    .setPermissions("user", "KICK_MEMBERS")
    .setPermissions("bot", "MANAGE_CHANNELS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
            .setDescription("The channel to unlock (default: current channel)")
            .setChannelTypes(TextableGuildChannels)
            .setMinMax(1, 500)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for unlocking the channel")
            .setMinMax(1, 500)
    )
    .setOptionsParser(interaction => ({
        channel: interaction.data.options.getCompleteChannel<AnyGuildTextChannelWithoutThreads>("channel", true),
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
            if (!(deny & lockPermissions)) return interaction.reply({ content: `H-hey! ${channel.id === interaction.channel.id ? "This" : "That"} that channel isn't locked..` });
            const [oldAllow, oldDeny] = (await db.redis.get(`lock:${interaction.channel.id}`).then(res => res ? (JSON.parse(res) as Array<string>).map(BigInt) : [0n, 0n]));
            for (const perm of lockPermissionsList) {
                if (deny & perm && !(oldDeny & perm)) deny &= ~perm;
                if (oldAllow & perm) allow |= perm;
            }
        }

        await channel.editPermission(interaction.guildID, {
            allow,
            deny,
            reason: `Unlock: ${interaction.user.tag} (${interaction.user.id}) -> ${reason ?? "None Provided"}`,
            type:   OverwriteTypes.ROLE
        });
        const { caseID } = await ModLogHandler.createEntry({
            type:   ModLogType.UNLOCK,
            guild:  interaction.guild,
            gConfig,
            blame:  interaction.member,
            reason,
            target: channel
        });
        await interaction.reply({ content: `<#${channel.id}> has been unlocked (case #${caseID})` });
    });
