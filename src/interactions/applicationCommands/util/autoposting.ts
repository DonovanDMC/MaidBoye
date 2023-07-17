import Command, { type ComponentInteraction, type ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { Colors } from "../../../util/Constants.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import AutoPostingEntry, {
    AutoPostingCategoryChoices,
    AutoPostingNSFW,
    type AutoPostingTime,
    AutoPostingTypes,
    ValidAutoPostingTimes,
    AutoPostingStatus,
    AutoPostingStatusNames
} from "../../../db/Models/AutoPostingEntry.js";
import Config from "../../../config/index.js";
import {
    type AnyTextableGuildChannelWithoutThreads,
    ApplicationCommandOptionTypes,
    ComponentTypes,
    InteractionResolvedChannel,
    type MessageActionRow,
    type Webhook,
    type GuildCommandInteraction,
    type GuildComponentInteraction,
    TextableGuildChannelsWithoutThreadsTypes,
    type TextableGuildChannelsWithoutThreads,
    type TextButton
} from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import chunk from "chunk";
import short from "short-uuid";
import assert from "node:assert";

const shrinkUUID = (str: string) => short().fromUUID(str);
export async function enableAutoposting(interaction: ComponentInteraction<ValidLocation.GUILD> | ModalSubmitInteraction<ValidLocation.GUILD>, channel: string, webhook: Webhook, type: AutoPostingTypes, time: number) {
    await AutoPostingEntry.create({
        type,
        time:          time as AutoPostingTime,
        channel_id:    channel,
        webhook_id:    webhook.id,
        webhook_token: webhook.token!,
        guild_id:      interaction.guild.id
    });

    const embed = Util.makeEmbed(true)
        .setTitle("AutoPosting Enabled")
        .setDescription(`Autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** has been enabled every **${time} Minutes** in this channel by ${interaction.user.mention}.`);
    if (webhook.avatar) {
        embed.setThumbnail(webhook.avatarURL()!);
    }
    await webhook.execute({
        embeds: embed.toJSON(true)
    });

    await (interaction.acknowledged ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))(Util.replaceContent({
        content: `Autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** has been enabled every **${time} Minutes** in <#${channel}> via **${webhook.name!}**.`
    }));
}

export async function autoPostingNav(interaction: GuildCommandInteraction | GuildComponentInteraction, page: number, channel?: string | null) {
    const autos = (await AutoPostingEntry.getAll(interaction.guild.id)).filter(ev => channel ? ev.channelID === channel : true);
    const list = chunk(autos, 10);
    return interaction.reply({
        embeds: Util.makeEmbed(true, interaction.user)
            .setDescription(list[0].map(a => `**${Util.readableConstant(AutoPostingTypes[a.type])}** every **${a.time} Minutes** in <#${a.channelID}> (Status: **${AutoPostingStatusNames[a.status]}**)`).join("\n"))
            .setColor(Colors.gold)
            .setFooter(`Page ${page}/${list.length}`)
            .toJSON(true),
        components: new ComponentBuilder<MessageActionRow>()
            .addInteractionButton({
                customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel ?? null).with("page", page).with("dir", -1).encode(),
                disabled: (page - 1) < 1,
                label:    "Previous Page",
                style:    ButtonColors.BLURPLE
            })
            .addInteractionButton({
                customID: State.exit(interaction.user.id),
                label:    "Exit",
                style:    ButtonColors.RED
            })
            .addInteractionButton({
                customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel ?? null).with("page", page).with("dir", 1).encode(),
                disabled: (page + 1) > list.length,
                label:    "Next Page",
                style:    ButtonColors.BLURPLE
            })
            .toJSON()
    });
}

export default new Command(import.meta.url, "autoposting")
    .setDescription("Manage the autoposting for this server")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "add")
            .setDescription("Add an autoposting entry.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "category")
                    .setDescription("The category of autoposting types to pick from.")
                    .setRequired()
                    .setChoices(AutoPostingCategoryChoices)
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "type")
                    .setDescription("The type to enable.")
                    .setRequired()
                    .setAutocomplete()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.NUMBER, "time")
                    .setDescription("How often to autopost.")
                    .setRequired()
                    .setChoices(ValidAutoPostingTimes.map(time => ({
                        name:  `${time} Minutes`,
                        value: time
                    })))
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to post to. Defaults to the current channel.")
                    .setChannelTypes(TextableGuildChannelsWithoutThreadsTypes)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "clear")
            .setDescription("Clear all autoposting entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to clear. Defaults to global.")
                    .setChannelTypes(TextableGuildChannelsWithoutThreadsTypes)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List all autoposting entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to list. Defaults to global.")
                    .setChannelTypes(TextableGuildChannelsWithoutThreadsTypes)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "remove")
            .setDescription("Remove an autoposting entry.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "entry")
                    .setDescription("The entry to remove.")
                    .setRequired()
                    .setAutocomplete()
            )
    )
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "enable")
        .setDescription("Enable a disabled autoposting entry.")
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.STRING, "entry")
                .setDescription("The entry to enable.")
                .setRequired()
                .setAutocomplete()
        )
    )
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "disable")
        .setDescription("Disable an autoposting entry.")
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.STRING, "entry")
                .setDescription("The entry to disable.")
                .setRequired()
                .setAutocomplete()
        )
    )
    .setOptionsParser(interaction => ({
        sub:     interaction.data.options.getSubCommand<["add" | "clear" | "list" | "remove" | "enable" | "disable"]>(true)[0],
        type:    interaction.data.options.getString<keyof typeof AutoPostingTypes>("type"),
        channel: interaction.data.options.getChannel("channel") as InteractionResolvedChannel | AnyTextableGuildChannelWithoutThreads | undefined,
        entry:   interaction.data.options.getString("entry"),
        time:    interaction.data.options.getNumber("time")
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { sub, type: rawType, channel, entry, time }) {
        if (channel && !TextableGuildChannelsWithoutThreadsTypes.includes(channel.type as TextableGuildChannelsWithoutThreads)) {
            return interaction.reply({
                content: `H-hey! <#${channel.id}> is not a valid textable channel..`
            });
        }
        if (time && !ValidAutoPostingTimes.includes(time as AutoPostingTime)) {
            return interaction.reply({
                content: `H-hey! **${time}** is not a valid autoposting time..`
            });
        }
        if (entry && !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(entry)) {
            return interaction.reply({
                content: "H-hey! That was not a valid autoposting entry.."
            });
        }
        switch (sub) {
            case "add": {
                assert(rawType);
                channel ??= interaction.channel as AnyTextableGuildChannelWithoutThreads;
                if (!time) {
                    time = 60;
                }
                if (!Object.hasOwn(AutoPostingTypes, rawType)) {
                    // Discord™️ - sometimes the name gets sent as the value
                    rawType = rawType.toUpperCase().replaceAll(/\s/g, "_") as typeof rawType;
                }
                const type = AutoPostingTypes[rawType];
                const autos = await AutoPostingEntry.getAll(interaction.guild.id);
                const enabled = autos.filter(ev => ev.status === AutoPostingStatus.ENABLED);
                if (autos.length >= AutoPostingEntry.MAX_TOTAL) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of autoposting entries (${AutoPostingEntry.MAX_TOTAL}) .. Remove some to add more.\n\nNote: This includes both enabled and disabled entries.`
                    }));
                }
                if (enabled.length >= AutoPostingEntry.MAX_ENABLED) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of enabled autoposting entries (${AutoPostingEntry.MAX_ENABLED}) .. Remove or disable some to add more.`
                    }));
                }

                const current = enabled.filter(ev => ev.type === type).length;

                if (current >= AutoPostingEntry.MAX_PER_TYPE) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of autoposting for **${Util.readableConstant(AutoPostingTypes[type])}** enabled.. Remove some to add more.`
                    }));
                }

                if (current > 0 && autos.some(ev => ev.type === type && ev.channelID === channel!.id)) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has autoposting for **${Util.readableConstant(AutoPostingTypes[type])}** enabled in <#${channel.id}>..`
                    }));
                }

                if (autos.length >= AutoPostingEntry.MAX_ENABLED) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! Adding that would put you over the autoposting limit (${AutoPostingEntry.MAX_ENABLED}).. Remove some to add it.`
                    }));
                }

                if (AutoPostingNSFW.includes(type) && !(channel instanceof InteractionResolvedChannel ? (channel.completeChannel as AnyTextableGuildChannelWithoutThreads | undefined)?.nsfw ?? false : channel.nsfw)) {
                    return interaction.reply({
                        content: `H-hey! Autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** must be done in an nsfw channel.`
                    });
                }

                let components = new ComponentBuilder<MessageActionRow>()
                    .addInteractionButton({
                        customID: State.new(interaction.user.id, "autoposting", "create-webhook").with("channel", channel.id).with("type", type).with("time", time).encode(),
                        label:    "Create Webhook",
                        style:    ButtonColors.BLURPLE
                    });

                let disableCreation = false, noUsable = true;
                if (("appPermissions" in channel ? channel.appPermissions : channel.permissionsOf(this.user.id)).has("MANAGE_WEBHOOKS")) {
                    let all: Array<Webhook>;
                    const webhooks = (all = await this.rest.webhooks.getForChannel(channel.id)).filter(hook => hook.name !== null && hook.token !== undefined);
                    if (all.length >= 15) {
                        disableCreation = true;
                        const c = components.toJSON()[0].components[0] as TextButton;
                        components = new ComponentBuilder<MessageActionRow>();
                        components.addInteractionButton({
                            customID: c.customID,
                            label:    c.label,
                            style:    c.style,
                            disabled: true
                        });
                    }
                    if (webhooks.length !== 0) {
                        noUsable = false;
                        components.addSelectMenu({
                            customID: State.new(interaction.user.id, "autoposting", "select-webhook").with("channel", channel.id).with("type", type).with("time", time).encode(),
                            options:  webhooks.map(hook => ({ label: hook.name!, value: hook.id })),
                            type:     ComponentTypes.STRING_SELECT
                        });
                    }
                }

                if (disableCreation && noUsable) {
                    return interaction.reply({
                        content: "H-hey! This channel has the maximum amount of webhooks (**15**), and none of them are usable by us. Keep in mind we can't use webhooks created by other bots. Delete some of them and try again."
                    });
                }

                return interaction.reply({
                    content:    `Please select an option for enabling the autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** in <#${channel.id}>.${disableCreation ? "\nWebhook creation has been disabled because this channel has the maximum amount of webhooks (**15**)." : ""}`,
                    components: components.toJSON()
                });
            }

            case "clear": {
                const autos = (await AutoPostingEntry.getAll(interaction.guild.id)).filter(ev => channel?.id ? ev.channelID === channel.id : true);
                if (autos.length === 0) {
                    return interaction.reply({
                        content: "H-hey! There aren't any entries to clear.."
                    });
                }

                return interaction.reply({
                    content:    `Are you sure you want to clear **${autos.length}** autoposting entries${channel ? ` in <#${channel.id}>` : ""}?`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "autoposting", "clear").with("channel", channel?.id ?? null).encode(),
                            label:    "Yes",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "No",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }

            case "list": {
                const autos = (await AutoPostingEntry.getCount(interaction.guild.id, undefined, channel?.id, true));
                if (autos === 0) {
                    return interaction.reply({
                        content: "H-hey! There aren't any entries to list.."
                    });
                }
                return autoPostingNav(interaction, 1, channel?.id);
            }

            case "remove": {
                const auto = await AutoPostingEntry.get(entry!);
                if (auto === null) {
                    return interaction.reply({
                        content: "H-hey! That entry doesn't exist.."
                    });
                }

                return interaction.reply({
                    content:    `Are you sure you want to remove the autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** in <#${auto.channelID}>?`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "autoposting", "remove").with("entry", shrinkUUID(entry!)).encode(),
                            label:    "Yes",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "No",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }

            case "enable": {
                assert(entry);
                if (entry === "all") {
                    const autos = await AutoPostingEntry.getAll(interaction.guild.id, "disabled");
                    if (autos.length === 0) {
                        return interaction.reply({
                            content: "H-hey! There aren't any entries to enable.."
                        });
                    }

                    if (autos.length === 1) {
                        entry = autos[0].id;
                    } else {
                        return interaction.reply({
                            content:    `Are you sure you want to enable **${autos.length}** autoposting entries?`,
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "autoposting", "enable").with("entry", "all").encode(),
                                    label:    "Yes",
                                    style:    ButtonColors.GREEN
                                })
                                .addInteractionButton({
                                    customID: State.cancel(interaction.user.id),
                                    label:    "No",
                                    style:    ButtonColors.RED
                                })
                                .toJSON()
                        });
                    }
                }
                const auto = await AutoPostingEntry.get(entry);
                if (auto === null) {
                    return interaction.reply({
                        content: "H-hey! That entry doesn't exist.."
                    });
                }

                const canEnable = await auto.canEnable(this);
                switch (canEnable) {
                    case "ALREADY_ENABLED": {
                        return interaction.reply({
                            content: "H-hey! That entry is already enabled.."
                        });
                    }

                    case "WEBHOOK_DELETED": {
                        return interaction.reply({
                            content:    "That entry was disabled due to the webhook being deleted. It cannot be enabled, please remove it and re-add it.",
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "autoposting", "remove").with("entry", shrinkUUID(entry)).encode(),
                                    label:    "Delete Entry",
                                    style:    ButtonColors.RED
                                })
                                .toJSON()
                        });
                    }

                    case "MAX_ENABLED": {
                        return interaction.reply(Util.replaceContent({
                            content: `H-hey! This server already has the maximum amount of enabled autoposting entries (${AutoPostingEntry.MAX_ENABLED}) .. Remove or disable some to add more.`
                        }));
                    }

                    case "MAX_PER_TYPE":{
                        return interaction.reply(Util.replaceContent({
                            content: `H-hey! This server already has the maximum amount of autoposting for **${Util.readableConstant(AutoPostingTypes[auto.type])}** enabled.. Remove some to add more.`
                        }));
                    }

                    case "CHANNEL_ALREADY_ENABLED": {
                        return interaction.reply(Util.replaceContent({
                            content: `H-hey! This server already has autoposting for **${Util.readableConstant(AutoPostingTypes[auto.type])}** enabled in <#${auto.channelID}>..`
                        }));
                    }

                    case "NSFW_CHECK_FAILED": {
                        return interaction.reply({
                            content: `H-hey! Autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** must be done in an nsfw channel. Please make <#${auto.channelID}> nsfw and try again.`
                        });
                    }
                }

                let notes = "";
                switch (auto.status) {
                    case AutoPostingStatus.DISABLED: {
                        notes = "This entry was manually disabled.";
                        break;
                    }
                    case AutoPostingStatus.REPEATED_FAILURES: {
                        notes = `This entry was disabled due to repeated failures when attempting to post. If this is a recurring issue, please join our support server. (${Config.discordLink})`;
                        break;
                    }
                }

                return interaction.reply({
                    content:    `Are you sure you want to enable the autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** in <#${auto.channelID}>?\n\n${notes}`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "autoposting", "enable").with("entry", shrinkUUID(entry)).encode(),
                            label:    "Yes",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "No",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }

            case "disable": {
                assert(entry);
                if (entry === "all") {
                    const autos = await AutoPostingEntry.getAll(interaction.guild.id, "enabled");
                    if (autos.length === 0) {
                        return interaction.reply({
                            content: "H-hey! There aren't any entries to disable.."
                        });
                    }

                    if (autos.length === 1) {
                        entry = autos[0].id;
                    } else {
                        return interaction.reply({
                            content:    `Are you sure you want to disable **${autos.length}** autoposting entries?`,
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "autoposting", "disable").with("entry", "all").encode(),
                                    label:    "Yes",
                                    style:    ButtonColors.GREEN
                                })
                                .addInteractionButton({
                                    customID: State.cancel(interaction.user.id),
                                    label:    "No",
                                    style:    ButtonColors.RED
                                })
                                .toJSON()
                        });
                    }
                }
                const auto = await AutoPostingEntry.get(entry);
                if (auto === null) {
                    return interaction.reply({
                        content: "H-hey! That entry doesn't exist.."
                    });
                }

                if (auto.status !== AutoPostingStatus.ENABLED) {
                    return interaction.reply({
                        content: "H-hey! That entry is already disabled.."
                    });
                }

                return interaction.reply({
                    content:    `Are you sure you want to disable the autoposting of **${Util.readableConstant(AutoPostingTypes[auto.type])}** in <#${auto.channelID}>?`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "autoposting", "disable").with("entry", shrinkUUID(entry)).encode(),
                            label:    "Yes",
                            style:    ButtonColors.GREEN
                        })
                        .addInteractionButton({
                            customID: State.cancel(interaction.user.id),
                            label:    "No",
                            style:    ButtonColors.RED
                        })
                        .toJSON()
                });
            }
        }
    });
