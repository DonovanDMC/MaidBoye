import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { lockPermissions, lockPermissionsList, TextableGuildChannels } from "../../../util/Constants.js";
import db from "../../../db/index.js";
import { Strings } from "@uwu-codes/utils";
import { AnyGuildTextChannelWithoutThreads, ApplicationCommandOptionTypes, OverwriteTypes, Permissions } from "oceanic.js";

export default new Command(import.meta.url, "lockdown")
    .setDescription("Lock all channels in the server")
    .setPermissions("user", "KICK_MEMBERS", "MANAGE_GUILD")
    .setPermissions("bot", "MANAGE_CHANNELS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for locking the server")
            .setMinMax(1, 500)
    )
    .setOptionsParser(interaction => ({
        reason: interaction.data.options.getString("reason") || "None Provided"
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { reason }, gConfig) {
        const old = await db.redis.get(`lockdown:${interaction.guildID}`);
        if (old) return interaction.reply({ content: "H-hey! This server has already been locked down.." });
        reason = Strings.truncateWords(reason, 500);
        const channels = interaction.guild.channels.filter(({ type }) => TextableGuildChannels.includes(type as typeof TextableGuildChannels[number])) as Array<AnyGuildTextChannelWithoutThreads>;
        const original: Array<[id: string, allow: string, deny: string]> = [];
        const errors: Array<Error> = [];
        for (const channel of channels) {
            const overwrite = channel.permissionOverwrites.get(interaction.guildID) ?? { allow: 0n, deny: 0n };
            // skip if send is already denied
            if (overwrite.deny & Permissions.SEND_MESSAGES) continue;
            else {
                let allow = overwrite.allow;
                original.push([channel.id, overwrite.allow.toString(), overwrite.deny.toString()]);
                for (const perm of lockPermissionsList) {
                    if (allow & perm) allow &= ~perm;
                }
                await channel.editPermission(interaction.guildID, {
                    allow,
                    deny:   (overwrite.deny | lockPermissions),
                    reason: `Lockdown: ${interaction.user.tag} (${interaction.user.id}) -> ${reason}`,
                    type:   OverwriteTypes.ROLE
                }).catch((err: Error) => {
                    errors.push(err);
                    original.splice(-1, 1);
                });
            }
        }
        if (original.length !== 0) await db.redis.set(`lockdown:${interaction.guildID}`, JSON.stringify(original));
        else if (errors.length === 0) return interaction.reply({ content: "No channels were locked" });
        const { caseID } = await ModLogHandler.createEntry({
            type:  ModLogType.LOCKDOWN,
            guild: interaction.guild,
            gConfig,
            blame: interaction.member,
            reason
        });
        await interaction.reply({ content: `**${original.length}** channel${original.length === 1 ? "" : "s"} have been locked (case #${caseID})\n\nNote: Members with the **administrator** permission, and any roles or members that have \`Send Messages\` ticked on in the permission overwrites will still be able to send messages.${errors.length === 0 ? "" : `\n\n${errors.length} error${errors.length === 1 ? "" : "s"} occurred while locking channels\n\n${errors.map((err, i) => `${i + 1}. \`${err.name}: ${err.message}\``).join("\n")}`}` });
    });
