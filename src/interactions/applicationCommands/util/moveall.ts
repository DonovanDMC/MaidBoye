import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import {
    ApplicationCommandOptionTypes,
    ChannelTypes,
    PermissionName,
    StageChannel,
    VoiceChannel
} from "oceanic.js";

export default new Command(import.meta.url, "moveall")
    .setDescription("move all voice members from one channel to another")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "old-channel")
            .setDescription("The channel to move users from")
            .setChannelTypes([
                ChannelTypes.GUILD_VOICE,
                ChannelTypes.GUILD_STAGE_VOICE
            ])
            .setRequired()
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "new-channel")
            .setDescription("The channel to move users to")
            .setChannelTypes([
                ChannelTypes.GUILD_VOICE,
                ChannelTypes.GUILD_STAGE_VOICE
            ])
            .setRequired()
    )
    .setOptionsParser(interaction => ({
        oldChannel: interaction.data.options.getCompleteChannel<VoiceChannel | StageChannel>("old-channel", true),
        newChannel: interaction.data.options.getCompleteChannel<VoiceChannel | StageChannel>("new-channel", true)
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { oldChannel, newChannel }) {
        const perms: Array<PermissionName> = [
                "CONNECT",
                "MOVE_MEMBERS"
            ],
            a = oldChannel.permissionsOf(interaction.user.id),
            b = oldChannel.permissionsOf(this.user.id),
            c = newChannel.permissionsOf(interaction.user.id),
            d = newChannel.permissionsOf(this.user.id),
            size = Number(newChannel.voiceMembers.size);

        if (size === 0) return interaction.reply({
            content: `H-hey! There aren't any users in <#${newChannel.id}> to move..`
        });

        for (const p of perms) {
            if (!a.has(p)) return interaction.reply({
                content: `H-hey! You must have access to join the channel you're moving people from.. You're missing **${p}**`
            });
            if (!b.has(p)) return interaction.reply({
                content: `H-hey! I do not have access to the channel you wanted to move people from.. I'm missing **${p}**`
            });
            if (!c.has(p)) return interaction.reply({
                content: `H-hey! You must have access to join the channel you're moving people to.. You're missing **${p}**`
            });
            if (!d.has(p)) return interaction.reply({
                content: `H-hey! I do not have access to the channel you wanted to move people to.. I'm missing **${p}**`
            });
        }
        for (const [,member] of oldChannel.voiceMembers) await member.edit({
            channelID: newChannel.id,
            reason:    `MoveAll: ${interaction.user.tag} (${interaction.user.id})`
        });

        return interaction.reply({
            content: `Moved **${size}** user${size === 1 ? "" : "s"} from <#${oldChannel.id}> to <#${newChannel.id}>`
        });
    });
