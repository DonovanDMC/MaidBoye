import ClientEvent from "../util/ClientEvent.js";
import CommandHandler from "../util/cmd/CommandHandler.js";
import GuildConfig from "../db/Models/GuildConfig.js";
import UserConfig from "../db/Models/UserConfig.js";
import Components from "../interactions/components/index.js";
import type { AckString, AnyCommand, CommandInteraction } from "../util/cmd/Command.js";
import Command, { ValidLocation  } from "../util/cmd/Command.js";
import type MaidBoye from "../main.js";
import Config from "../config/index.js";
import Autocomplete from "../interactions/autocomplete/index.js";
import { UserCommand, MessageCommand } from "../util/cmd/OtherCommand.js";
import Leveling from "../util/Leveling.js";
import StatsHandler from "../util/StatsHandler.js";
import { PermissionsByName } from "../util/Names.js";
import Modals from "../interactions/modals/index.js";
import Logger from "../util/Logger.js";
import ExceptionHandler from "../util/handlers/ExceptionHandler.js";
import {
    ApplicationCommandTypes,
    type InteractionOptionsSubCommand,
    type InteractionOptionsSubCommandGroup,
    type InteractionOptionsWithValue,
    InteractionTypes,
    MessageFlags,
    type PermissionName
} from "oceanic.js";

async function processRestrictions(this: MaidBoye, cmd: AnyCommand, interaction: CommandInteraction) {
    if (cmd.restrictions.includes("beta") && !Config.isDevelopment) {
        StatsHandler.track("FAILED_RESTRICTION", "beta");
        await interaction.reply({
            content: "This command can only be used in development mode.",
            flags:   MessageFlags.EPHEMERAL
        });
        return false;
    }
    if (cmd.restrictions.includes("nsfw")) {
        // if guild is not present & user is present, we can safely assume we are dm
        const nsfw = "guild" in interaction && interaction.guild !== undefined ? ("nsfw" in interaction.channel && interaction.channel.nsfw !== undefined ? interaction.channel.nsfw : false) : "user" in interaction && interaction.user !== undefined;
        if (!nsfw) {
            StatsHandler.track("FAILED_RESTRICTION", "nsfw");
            await interaction.reply({
                content: "H-hey! Careful there, this command must be ran in an nsfw channel..",
                flags:   MessageFlags.EPHEMERAL
            });
            return false;
        }
    }
    return true;
}

async function processAck(this: MaidBoye, cmd: AnyCommand, interaction: CommandInteraction, ephemeralUser: boolean, options?:  Record<string, unknown>) {
    if (typeof cmd.ack === "function") {
        let ack: false | void | AckString;
        if (cmd instanceof Command) {
            ack = await cmd.ack.call(this, interaction, options! as Record<string, never>, ephemeralUser, cmd);
        } else if (cmd instanceof UserCommand) {
            ack = await cmd.ack.call(this, interaction, ephemeralUser, cmd);
        } else if (cmd instanceof MessageCommand) {
            ack = await cmd.ack.call(this, interaction, ephemeralUser, cmd);
        }
        if (ack !== undefined) {
            switch (ack) {
                case false: {
                    return false;
                }
                case "ephemeral": {
                    await interaction.defer(MessageFlags.EPHEMERAL); break;
                }
                case "ephemeral-user": {
                    await (ephemeralUser ? interaction.defer(MessageFlags.EPHEMERAL) : interaction.defer());
                    break;
                }
                case "command-images-check": {
                    if (cmd.validLocation !== ValidLocation.GUILD) {
                        return false;
                    }
                    if (!(interaction as unknown as CommandInteraction<ValidLocation.GUILD>).channel.permissionsOf(this.user.id).has("ATTACH_FILES")) {
                        return interaction.reply({
                            flags:   MessageFlags.EPHEMERAL,
                            content: "H-hey! This server has the **Command Images** setting enabled, but I cannot attach files.. Please correct this."
                        });
                    }
                    break;
                }
            }
        }
    } else {
        switch (cmd.ack) {
            case "ephemeral": {
                await interaction.defer(MessageFlags.EPHEMERAL); break;
            }
            case "ephemeral-user": {
                await (ephemeralUser ? interaction.defer(MessageFlags.EPHEMERAL) : interaction.defer());
                break;
            }
            case "command-images-check": {
                if (cmd.validLocation !== ValidLocation.GUILD) {
                    return false;
                }
                if (!(interaction as unknown as CommandInteraction<ValidLocation.GUILD>).channel.permissionsOf(this.user.id).has("ATTACH_FILES")) {
                    return interaction.reply({
                        flags:   MessageFlags.EPHEMERAL,
                        content: "H-hey! This server has the **Command Images** setting enabled, but I cannot attach files.. Please correct this."
                    });
                }
                break;
            }
            case "none": {
                break;
            }
            default: {
                await interaction.defer(); break;
            }
        }
    }

    return true;
}

function stringifyArguments(interaction: CommandInteraction) {
    if (interaction.data.options.raw.length === 0) {
        return null;
    }

    let args: Array<InteractionOptionsWithValue> | undefined;
    const [sub, subGroup] = interaction.data.options.getSubCommand() ?? [];
    let str = `${subGroup ? `${subGroup} ` : ""}${sub ? `${sub} ` : ""}`;
    if (subGroup) {
        args = ((interaction.data.options.raw[0] as InteractionOptionsSubCommandGroup).options?.[0] as InteractionOptionsSubCommand).options;
    } else if (sub) {
        args = (interaction.data.options.raw[0] as InteractionOptionsSubCommand).options;
    } else {
        args = interaction.data.options.raw as Array<InteractionOptionsWithValue>;
    }

    if (args) {
        for (const arg of args) {
            str += `${arg.name}: ${String(arg.value)} `;
        }
    }

    return str.trim();
}

export default new ClientEvent("interactionCreate", async function interactionCreate(interaction) {
    StatsHandler.track("INTERACTION", interaction.type, interaction.type === InteractionTypes.APPLICATION_COMMAND ? interaction.data.type : null, [`shard:${"guild" in interaction  && interaction.guild ? interaction.guild.shard.id : 0}`]);
    switch (interaction.type) {
        case InteractionTypes.APPLICATION_COMMAND: {
            switch (interaction.data.type) {
                case ApplicationCommandTypes.CHAT_INPUT: {
                    Logger.getLogger("CommandHandler").info(`Command "${interaction.data.name}" ran by ${interaction.user.tag} (${interaction.user.id}) with ${interaction.data.options.raw.length === 0 ? "no arguments" : `the arguments "${stringifyArguments(interaction)!}"`}`);
                    const cmd = CommandHandler.getCommand("default", interaction.data.name);
                    if (!cmd) {
                        return interaction.reply({
                            content: "We couldn't figure out how to execute that command.",
                            flags:   MessageFlags.EPHEMERAL
                        });
                    }

                    if (!(await processRestrictions.call(this, cmd, interaction))) {
                        return;
                    }

                    if ("guildID" in interaction && !Config.developers.includes(interaction.user.id)) {
                        if (cmd.userPermissions.length !== 0 && interaction.user) {
                            const missingRequired: Array<PermissionName> = [], missingOptional: Array<PermissionName> = [];
                            for (const [perm, optional] of cmd.userPermissions) {
                                if (!interaction.member.permissions.has(perm)) {
                                    (optional ? missingOptional : missingRequired).push(perm);
                                }
                            }

                            // we don't really use optional permissions, and I have no idea how to display them to the user if we did
                            if (missingRequired.length !== 0) {
                                console.log(missingRequired);
                                return interaction.reply({
                                    content: `H-hey! You're missing some permissions needed to use that..\n${missingRequired.map(p => `- ${PermissionsByName[p]}`).join("\n")}`,
                                    flags:   MessageFlags.EPHEMERAL
                                });
                            }
                        }

                        if (cmd.botPermissions.length !== 0 && interaction.guild) {
                            const missingRequired: Array<PermissionName> = [], missingOptional: Array<PermissionName> = [];
                            for (const [perm, optional] of cmd.botPermissions) {
                                if (!(interaction.appPermissions || interaction.channel.permissionsOf(this.user.id)).has(perm)) {
                                    (optional ? missingOptional : missingRequired).push(perm);
                                }
                            }
                            if (missingRequired.length !== 0) {
                                return interaction.reply({
                                    content: `H-hey! I'm missing some permissions needed to use that..\n${missingRequired.map(p => `- ${PermissionsByName[p]}`).join("\n")}`,
                                    flags:   MessageFlags.EPHEMERAL
                                });
                            }
                        }
                    }

                    let gConfig: GuildConfig | null = null, uConfig: UserConfig | null = null;
                    if (cmd.doGuildLookup && "guildID" in interaction) {
                        gConfig = await GuildConfig.get(interaction.guildID);
                    }
                    if (cmd.doUserLookup) {
                        uConfig = await UserConfig.get(interaction.user.id);
                    }

                    const opt = await cmd.parseOptions.call(this, interaction, cmd);
                    const ephemeralUser = uConfig ? uConfig.preferences.ephemeral : await UserConfig.getEphemeral(interaction.user.id);
                    const ack = await processAck.call(this, cmd, interaction, ephemeralUser, opt);
                    if (ack === false) {
                        return;
                    }

                    void cmd.run.call(this, interaction, opt as Record<string, never>, gConfig as null, uConfig as null, cmd)
                        .catch(async err => {
                            const code =  await ExceptionHandler.handle(err as Error, "command", [
                                `User: **${interaction.user.tag}** (${interaction.user.id})`,
                                `Guild: **${interaction.inCachedGuildChannel() ? interaction.guild.name : "DM"}** (${"guildID" in interaction ? interaction.guildID : "DM"})`,
                                `Channel: **${interaction.channel && "name" in interaction.channel ? interaction.channel.name : "DM"}** (${interaction.channelID})`,
                                `Command: **${interaction.data.name}** (Chat Input)`,
                                `Arguments: ${stringifyArguments(interaction) || "none"}`
                            ].join("\n"));
                            await interaction.reply({
                                content: `H-hey! Something went wrong while executing that command..\nYou can try again, or report it to one of my developers.\n\nCode: \`${code}\`\nSupport Server: <${Config.discordLink}>`,
                                flags:   MessageFlags.EPHEMERAL
                            });
                        });
                    if ("guildID" in interaction) {
                        await Leveling.run(interaction as unknown as CommandInteraction<ValidLocation.GUILD>);
                    }
                    break;
                }

                case ApplicationCommandTypes.USER: {
                    const cmd = CommandHandler.getCommand("user", interaction.data.name);
                    if (!cmd) {
                        return interaction.reply({
                            content: "We couldn't figure out how to execute that command.",
                            flags:   MessageFlags.EPHEMERAL
                        });
                    }

                    if (!(await processRestrictions.call(this, cmd, interaction))) {
                        return;
                    }

                    let gConfig: GuildConfig | null = null, uConfig: UserConfig | null = null;
                    if (cmd.doGuildLookup && "guildID" in interaction) {
                        gConfig = await GuildConfig.get(interaction.guildID);
                    }
                    if (cmd.doUserLookup) {
                        uConfig = await UserConfig.get(interaction.user.id);
                    }
                    const ephemeralUser = uConfig ? uConfig.preferences.ephemeral : await UserConfig.getEphemeral(interaction.user.id);
                    const ack = await processAck.call(this, cmd, interaction, ephemeralUser);
                    if (ack === false) {
                        return;
                    }

                    // generics do weird things
                    void cmd.run.call(this, interaction, gConfig as null, uConfig as null, cmd)
                        .catch(async err => {
                            const code =  await ExceptionHandler.handle(err as Error, "command", [
                                `User: **${interaction.user.tag}** (${interaction.user.id})`,
                                `Guild: **${interaction.inCachedGuildChannel() ? interaction.guild.name : "DM"}** (${"guildID" in interaction ? interaction.guildID : "DM"})`,
                                `Channel: **${interaction.channel && "name" in interaction.channel ? interaction.channel.name : "DM"}** (${interaction.channelID})`,
                                `Command: **${interaction.data.name}** (User)`
                            ].join("\n"));
                            await interaction.reply({
                                content: `H-hey! Something went wrong while executing that command..\nYou can try again, or report it to one of my developers.\n\nCode: \`${code}\`\nSupport Server: <${Config.discordLink}>`,
                                flags:   MessageFlags.EPHEMERAL
                            });
                        });
                    break;
                }

                // the above doesn't want to work dynamically
                case ApplicationCommandTypes.MESSAGE: {
                    const cmd = CommandHandler.getCommand("message", interaction.data.name);
                    if (!cmd) {
                        return interaction.reply({
                            content: "We couldn't figure out how to execute that command.",
                            flags:   MessageFlags.EPHEMERAL
                        });
                    }

                    if (!(await processRestrictions.call(this, cmd, interaction))) {
                        return;
                    }

                    let gConfig: GuildConfig | null = null, uConfig: UserConfig | null = null;
                    if (cmd.doGuildLookup && "guildID" in interaction) {
                        gConfig = await GuildConfig.get(interaction.guildID);
                    }
                    if (cmd.doUserLookup) {
                        uConfig = await UserConfig.get(interaction.user.id);
                    }
                    const ephemeralUser = uConfig ? uConfig.preferences.ephemeral : await UserConfig.getEphemeral(interaction.user.id);
                    const ack = await processAck.call(this, cmd, interaction, ephemeralUser);
                    if (ack === false) {
                        return;
                    }
                    // generics do weird things
                    void cmd.run.call(this, interaction, gConfig as null, uConfig as null, cmd)
                        .catch(async err => {
                            const code =  await ExceptionHandler.handle(err as Error, "command", [
                                `User: **${interaction.user.tag}** (${interaction.user.id})`,
                                `Guild: **${interaction.inCachedGuildChannel() ? interaction.guild.name : "DM"}** (${"guildID" in interaction ? interaction.guildID : "DM"})`,
                                `Channel: **${interaction.channel && "name" in interaction.channel ? interaction.channel.name : "DM"}** (${interaction.channelID})`,
                                `Command: **${interaction.data.name}** (Message)`
                            ].join("\n"));
                            await interaction.reply({
                                content: `H-hey! Something went wrong while executing that command..\nYou can try again, or report it to one of my developers.\n\nCode: \`${code}\`\nSupport Server: <${Config.discordLink}>`,
                                flags:   MessageFlags.EPHEMERAL
                            });
                        });
                    break;
                }
            }
            break;
        }

        case InteractionTypes.MESSAGE_COMPONENT: {
            await Components.handleInteraction(interaction);
            break;
        }

        case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
            await Autocomplete.handleInteraction(interaction);
            break;
        }

        case InteractionTypes.MODAL_SUBMIT: {
            await Modals.handleInteraction(interaction);
            break;
        }
    }
});
