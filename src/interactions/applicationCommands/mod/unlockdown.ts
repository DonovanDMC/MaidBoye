import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { lockPermissions, lockPermissionsList, TextableGuildChannels } from "../../../util/Constants.js";
import db from "../../../db/index.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes, OverwriteTypes } from "oceanic.js";

export default new Command(import.meta.url, "unlockdown")
    .setDescription("Undo a lockdown")
    .setPermissions("user", "KICK_MEMBERS", "MANAGE_GUILD")
    .setPermissions("bot", "MANAGE_CHANNELS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for unlocking the server")
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
        if (!old) return interaction.reply({ content: "H-hey! This server hasn't been locked down.." });
        reason = Strings.truncateWords(reason, 500);
        const channels = interaction.guild.channels.filter(({ type }) => TextableGuildChannels.includes(type as typeof TextableGuildChannels[number])) ;
        const original = JSON.parse(old) as Array<[id: string, allow: string, deny: string]>;
        const errors: Array<Error> = [];
        let changes = 0;
        for (const channel of channels) {
            const og = original.find(([id]) => id === channel.id);
            const [oldAllow, oldDeny] = !og ? [0n, 0n] : [BigInt(og[1]), BigInt(og[2])];
            const overwrite = channel.permissionOverwrites.get(interaction.guildID);
            if (overwrite) {
                let allow = overwrite.allow, deny = overwrite.deny;
                if (!(deny & lockPermissions)) continue;
                changes++;
                for (const perm of lockPermissionsList) {
                    if (deny & perm && !(oldDeny & perm)) deny &= ~perm;
                    if (oldAllow & perm) allow |= perm;
                }
                await channel.editPermission(interaction.guildID, {
                    allow,
                    deny,
                    reason: `Unlockdown: ${interaction.user.tag} (${interaction.user.id}) -> ${reason}`,
                    type:   OverwriteTypes.ROLE
                }).catch((err: Error) => {
                    errors.push(err);
                    changes--;
                });
            }
        }
        await db.redis.del(`lockdown:${interaction.guildID}`);
        if (changes === 0 && errors.length === 0) return interaction.reply({ content: "No channels were unlocked" });
        const { caseID } = await ModLogHandler.createEntry({
            type:  ModLogType.UNLOCKDOWN,
            guild: interaction.guild,
            gConfig,
            blame: interaction.member,
            reason
        });
        await interaction.reply({ content: `**${changes}** channel${changes === 1 ? "" : "s"} have been unlocked (case #${caseID})${errors.length === 0 ? "" : `\n\n${errors.length} error${errors.length === 1 ? "" : "s"} occurred while unlocking channels\n\n${errors.map((err, i) => `${i + 1}. \`${err.name}: ${err.message}\``).join("\n")}`}` });
    });
