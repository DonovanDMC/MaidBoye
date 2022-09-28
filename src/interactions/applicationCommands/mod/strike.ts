import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import Strike, { StrikeType } from "../../../db/Models/Strike.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { ApplicationCommandOptionTypes } from "oceanic.js";
import { randomUUID } from "crypto";

export default new Command(import.meta.url, "strike")
    .setDescription("Add a strike or several to a user")
    .setPermissions("user", "MANAGE_MESSAGES")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.USER, "user")
            .setDescription("The user to strike")
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.INTEGER, "amount")
            .setDescription("The amount of strikes to add to the user")
            .setMinMax(1, 10)
    )
    .setOptionsParser(interaction => ({
        member: interaction.data.options.getMember("user", true),
        amount: interaction.data.options.getInteger("amount") || 0
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { member, amount }) {
        if (member.id === interaction.member.id) return interaction.reply({ content: "H-hey! You can't strike yourself!" });
        if (Util.compareMemberToMember(member, interaction.member) !== "lower") return interaction.reply({ content: "H-hey! You can't strike people higher than you!" });
        if (amount < 1) return interaction.reply({ content: "Y-you have to add at least one strike.." });
        if (amount > 10) return interaction.reply({ content: "Y-you cannot add more than 10 strikes at a time.." });
        await UserConfig.createIfNotExists(member.id);
        await Strike.create({
            user_id:  member.id,
            guild_id: interaction.guildID,
            amount,
            type:     StrikeType.STRIKE,
            blame_id: interaction.member.id,
            id:       randomUUID()
        });
        const count = await Strike.getCountForUser(interaction.guildID, member.id);
        return interaction.reply({
            allowedMentions: { users: false },
            content:         `Successfully added **${amount}** strike${amount !== 1 ? "s" : ""} to ${member.mention}, they now have **${count}** strike${count !== 1 ? "s" : ""}`
        });
    });
