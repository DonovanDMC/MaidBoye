import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import Warning from "../../../db/Models/Warning.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";
import { randomUUID } from "node:crypto";

export default new Command(import.meta.url, "warn")
    .setDescription("Warn a user for something they're doing")
    .setPermissions("user", "KICK_MEMBERS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to warn")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for softbanning the user")
            .setMinMax(1, 500)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "dm")
            .setDescription("If we should attempt to dm the warned user with some info (default: yes)")
    )
    .setOptionsParser(interaction => ({
        member: interaction.data.options.getMember("user", true),
        reason: interaction.data.options.getString("reason") || "None Provided",
        dm:     interaction.data.options.getBoolean("dm") ?? true
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { member, reason, dm }, gConfig) {
        if (member.id === interaction.user.id) return interaction.reply({ content: "H-hey! You can't warn yourself.." });
        if (Util.compareMemberToMember(member, interaction.member) !== "lower") return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as your highest role, you cannot warn them.." });
        reason = Strings.truncateWords(reason, 500);
        await UserConfig.createIfNotExists(member.id);
        const w = await Warning.create({
            user_id:    member.id,
            guild_id:   interaction.guildID,
            blame_id:   interaction.member.id,
            id:         randomUUID(),
            reason,
            warning_id: await Warning.getNextID(interaction.guildID, member.id)
        });
        let dmError: Error | undefined;
        if (dm && !member.bot) await (await member.user.createDM()).createMessage({
            allowedMentions: { users: false },
            content:         `You were warned in ${interaction.guild.name}${gConfig.settings.dmBlame ? ` by **${interaction.member.mention}**` : ""}\nReason:\n\`\`\`\n${reason}\`\`\``
        }).catch((err: Error) => dmError = err);
        const { caseID, entry } = await ModLogHandler.createEntry({
            type:      ModLogType.WARNING,
            guild:     interaction.guild,
            gConfig,
            blame:     interaction.member,
            reason,
            target:    member,
            warningID: w.id
        });
        return interaction.reply({
            allowedMentions: { users: false },
            content:         `Successfully warned ${member.mention}, ***${reason}*** - Case #${caseID}${!entry.channelID ? "" : ` (<#${entry.channelID}>)`}${dmError ? `\nFailed To DM Member: \`${dmError.name}: ${dmError.message}\`` : ""}`
        });
    });
