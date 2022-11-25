import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "ban")
    .setDescription("Ban someone from this server..")
    .setPermissions("user", "BAN_MEMBERS")
    .setPermissions("bot", "BAN_MEMBERS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to ban (an id can be provided)")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for banning the user")
            .setMinMax(1, 500)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "days")
            .setDescription("The amount of days the ban will last")
            .setMinMax(1, 1825) // approximately 5 years
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "hours")
            .setDescription("The amount of hours the ban will last")
            .setMinMax(1, 23)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "minutes")
            .setDescription("The amount of minutes the ban will last")
            .setMinMax(1, 59)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "dm")
            .setDescription("If we should attempt to dm the banned user with some info (default: yes)")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "delete-hours")
            .setDescription("The hours of messages that should be deleted")
            .setMinMax(0, 168)
    )
    .setOptionsParser(interaction => ({
        user:        interaction.data.options.getUser("user", true),
        reason:      interaction.data.options.getString("reason") || "None Provided",
        days:        interaction.data.options.getInteger("days") || 0,
        hours:       interaction.data.options.getInteger("hours") || 0,
        minutes:     interaction.data.options.getInteger("minutes") || 0,
        dm:          interaction.data.options.getBoolean("dm") ?? true,
        deleteHours: interaction.data.options.getInteger("delete-hours") || 0
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { user, reason, days, hours, minutes, dm, deleteHours }, gConfig) {
        if (user.id === interaction.user.id) {
            return interaction.reply({ content: "H-hey! You can't ban yourself.." });
        }
        if (user.id === interaction.guild.ownerID) {
            return interaction.reply({ content: "H-hey! You can't ban the server owner.." });
        }
        const member = await this.getMember(interaction.guildID, user.id);
        if (member) {
            if (Util.compareMemberToMember(member, interaction.member) !== "lower") {
                return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as your highest role, you cannot ban them.." });
            }
            if (Util.compareMemberToMember(member, interaction.channel.guild.clientMember) !== "lower") {
                return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as my highest role, I cannot ban them.." });
            }
        }
        const time = (((days * 24) + hours) * 60 + minutes) * 60;
        const deleteSeconds = deleteHours * 60 * 60;
        reason = Strings.truncateWords(reason, 500);

        return interaction.guild.createBan(user.id, { deleteMessageSeconds: deleteSeconds, reason })
            .catch((err: Error) => interaction.reply({
                allowedMentions: { users: false },
                content:         `I-I failed to ban ${user.mention}..\n\`${err.name}: ${err.message}\``
            }))
            .then(async() => {
                let dmError: Error | undefined;
                if (dm && !user.bot) {
                    await (await user.createDM()).createMessage({
                        allowedMentions: { users: false },
                        content:         `You were banned from ${interaction.guild.name}${gConfig.settings.dmBlame ? ` by ${interaction.member.mention}` : ""}\nReason:\n\`\`\`\n${reason}\`\`\`\nExpires: ${time === 0 ? "**Never**" : Util.formatDiscordTime(Date.now() + (time * 1000), "long-datetime", true)}`
                    }).catch((err: Error) => dmError = err);
                }
                const { caseID, entry } = await ModLogHandler.createEntry({
                    type:   ModLogType.BAN,
                    guild:  interaction.guild,
                    gConfig,
                    blame:  interaction.member,
                    reason,
                    target: user,
                    time,
                    deleteSeconds
                });
                return interaction.reply({
                    allowedMentions: { users: false },
                    content:         `${time === 0 ? `Successfully permanently banned ${user.mention}` : `Successfully banned ${user.mention} until ${Util.formatDiscordTime(Date.now() + (time * 1000), "long-datetime", true)}`}, ***${reason}*** - Case #${caseID}${entry.channelID ? ` (<#${entry.channelID}>)` : ""}${dmError ? `\nFailed To DM Member: \`${dmError.name}: ${dmError.message}\`` : ""}`
                });
            });
    });
