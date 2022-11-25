import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "softban")
    .setDescription("Ban someone from this server, then immediately unban them..")
    .setPermissions("user", "BAN_MEMBERS")
    .setPermissions("bot", "BAN_MEMBERS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to ban")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for softbanning the user")
            .setMinMax(1, 500)
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
        member:      interaction.data.options.getMember("user", true),
        reason:      interaction.data.options.getString("reason") || "None Provided",
        dm:          interaction.data.options.getBoolean("dm") ?? true,
        deleteHours: interaction.data.options.getInteger("delete-hours") || 0
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { member, reason, dm, deleteHours }, gConfig) {
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: "H-hey! You can't softban yourself.." });
        }
        if (member.id === interaction.guild.ownerID) {
            return interaction.reply({ content: "H-hey! You can't softban the server owner.." });
        }
        if (Util.compareMemberToMember(member, interaction.member) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as your highest role, you cannot softban them.." });
        }
        if (Util.compareMemberToMember(member, interaction.channel.guild.clientMember) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as my highest role, I cannot softban them.." });
        }
        const deleteSeconds = deleteHours * 60 * 60;
        reason = Strings.truncateWords(reason, 500);

        return member.ban({ deleteMessageSeconds: deleteSeconds, reason })
            .catch((err: Error) => interaction.reply({
                allowedMentions: { users: false },
                content:         `I-I failed to softban ${member.mention}..\n\`${err.name}: ${err.message}\``
            }))
            .then(async() => {
                let dmError: Error | undefined;
                if (dm && !member.bot) {
                    await (await member.user.createDM()).createMessage({
                        allowedMentions: { users: false },
                        content:         `You were softbanned from ${interaction.guild.name}${gConfig.settings.dmBlame ? ` by **${interaction.member.mention}**` : ""}\nReason:\n\`\`\`\n${reason}\`\`\``
                    }).catch((err: Error) => dmError = err);
                }
                const { caseID, entry } = await ModLogHandler.createEntry({
                    type:   ModLogType.SOFTBAN,
                    guild:  interaction.guild,
                    gConfig,
                    blame:  interaction.member,
                    reason,
                    target: member,
                    deleteSeconds
                });
                return interaction.reply({
                    allowedMentions: { users: false },
                    content:         `Successfully softbanned ${member.mention}, ***${reason}*** - Case #${caseID}${entry.channelID ? ` (<#${entry.channelID}>)` : ""}${dmError ? `\nFailed To DM Member: \`${dmError.name}: ${dmError.message}\`` : ""}`
                });
            });
    });
