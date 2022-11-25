import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import { ModLogType } from "../../../db/Models/ModLog.js";
import Util from "../../../util/Util.js";
import { Strings } from "@uwu-codes/utils";
import { ApplicationCommandOptionTypes } from "oceanic.js";

export default new Command(import.meta.url, "kick")
    .setDescription("Forcefully remove someone from this server..")
    .setPermissions("user", "KICK_MEMBERS")
    .setPermissions("bot", "KICK_MEMBERS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to kick")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
            .setDescription("The reason for banning the user")
            .setMinMax(1, 500)
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "dm")
            .setDescription("If we should attempt to dm the banned user with some info (default: yes)")
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
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: "H-hey! You can't kick yourself.." });
        }
        if (member.id === interaction.guild.ownerID) {
            return interaction.reply({ content: "H-hey! You can't kick the server owner.." });
        }
        if (Util.compareMemberToMember(member, interaction.member) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as your highest role, you cannot kick them.." });
        }
        if (Util.compareMemberToMember(member, interaction.channel.guild.clientMember) !== "lower") {
            return interaction.reply({ content: "H-hey! That member's highest role is higher than or as high as my highest role, I cannot kick them.." });
        }
        reason = Strings.truncateWords(reason, 500);

        return member.kick(reason)
            .catch((err: Error) => interaction.reply({
                allowedMentions: { users: false },
                content:         `I-I failed to kick ${member.mention}..\n\`${err.name}: ${err.message}\``
            }))
            .then(async() => {
                let dmError: Error | undefined;
                if (dm && !member.bot) {
                    await (await member.user.createDM()).createMessage({
                        allowedMentions: { users: false },
                        content:         `You were kicked from ${interaction.guild.name}${gConfig.settings.dmBlame ? ` by ${interaction.member.mention}` : ""}\nReason:\n\`\`\`\n${reason}\`\`\``
                    }).catch((err: Error) => dmError = err);
                }
                const { caseID, entry } = await ModLogHandler.createEntry({
                    type:   ModLogType.KICK,
                    guild:  interaction.guild,
                    gConfig,
                    blame:  interaction.member,
                    reason,
                    target: member
                });
                return interaction.reply({
                    allowedMentions: { users: false },
                    content:         `Successfully kicked ${member.mention}, ***${reason}*** - Case #${caseID}${entry.channelID ? ` (<#${entry.channelID}>)` : ""}${dmError ? `\nFailed To DM Member: \`${dmError.name}: ${dmError.message}\`` : ""}`
                });
            });
    });
