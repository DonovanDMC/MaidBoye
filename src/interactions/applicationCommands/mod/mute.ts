import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "mute")
    .setDescription("Mute someone in this server..")
    .setPermissions("user", "MODERATE_MEMBERS")
    .setPermissions("bot", "MODERATE_MEMBERS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to mute")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for muting the user")
            .setMinMax(1, 500)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "days")
            .setDescription("The amount of days the mute will last")
            .setMinMax(1, 1825) // approximately 5 years
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "hours")
            .setDescription("The amount of hours the mute will last")
            .setMinMax(1, 23)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "minutes")
            .setDescription("The amount of minutes the mute will last")
            .setMinMax(1, 59)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "dm")
            .setDescription("If we should attempt to dm the muted user with some info (default: yes)")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "hide-reason")
            .setDescription("If we should hide the reason from non-moderators (permission: MANAGE_GUILD)")
    )
    .setOptionsParser(interaction => ({
        member:     interaction.data.options.getMember("user", true),
        reason:     interaction.data.options.getString("reason") || "None Provided",
        days:       interaction.data.options.getInteger("days") || 0,
        hours:      interaction.data.options.getInteger("hours") || 0,
        minutes:    interaction.data.options.getInteger("minutes") || 0,
        dm:         interaction.data.options.getBoolean("dm") ?? true,
        hideReason: interaction.data.options.getBoolean("hide-reason") ?? false
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { member, reason, days, hours, minutes, dm, hideReason  }, gConfig) {
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: "H-hey! You can't mute yourself.." });
        }
        if (member.id === interaction.guild.ownerID) {
            return interaction.reply({ content: "H-hey! You can't mute the server owner.." });
        }
        if (Util.compareMemberToMember(member, interaction.member) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as your highest role, you cannot mute them.." });
        }
        if (Util.compareMemberToMember(member, interaction.channel.guild.clientMember) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as my highest role, I cannot mute them.." });
        }
        if (member.communicationDisabledUntil !== null) {
            return interaction.reply({ content: "H-hey! That member is already muted.." });
        }
        const time = (((days * 24) + hours) * 60 + minutes) * 60;
        reason = Strings.truncateWords(reason, 500);

        // anything higher is delegated to timeout renewals
        const max = 1000 * 60 * 60 * 24 * 28;
        return member.edit({ communicationDisabledUntil: new Date(Date.now() + Math.min(time * 1000, max)).toISOString() })
            .catch((err: Error) => interaction.reply({
                allowedMentions: { users: false },
                content:         `I-I failed to mute ${member.mention}..\n\`${err.name}: ${err.message}\``
            }))
            .then(async() => {
                let dmError: Error | undefined;
                if (dm && !member.bot) {
                    await (await member.user.createDM()).createMessage({
                        allowedMentions: { users: false },
                        content:         `You were muted in ${interaction.guild.name}${gConfig.settings.dmBlame ? ` by **${interaction.member.mention}**` : ""}\nReason:\n\`\`\`\n${reason}\`\`\`\nExpires: ${time === 0 ? "**Never**" : Util.formatDiscordTime(Date.now() + (time * 1000), "long-datetime", true)}`
                    }).catch((err: Error) => dmError = err);
                }
                const { caseID, entry } = await ModLogHandler.createEntry({
                    type:   ModLogType.MUTE,
                    guild:  interaction.guild,
                    gConfig,
                    blame:  interaction.member,
                    reason,
                    target: member,
                    time,
                    hideReason
                });
                return interaction.reply({
                    allowedMentions: { users: false },
                    content:         `${time === 0 ? `Successfully permanently muted ${member.mention}` : `Successfully muted ${member.mention} until ${Util.formatDiscordTime(Date.now() + (time * 1000), "long-datetime", true)}`}, ***${reason}*** - Case #${caseID}${entry.channelID ? ` (<#${entry.channelID}>)` : ""}${dmError ? `\nFailed To DM Member: \`${dmError.name}: ${dmError.message}\`` : ""}`
                });
            });
    });
