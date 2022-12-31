import Command, { type ComponentInteraction, type ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { Colors, TextableGuildChannels } from "../../../util/Constants.js";
import LogEvent, { LogCategoriesChoices, LogEvents, LogEventsAllValue } from "../../../db/Models/LogEvent.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import {
    type AnyGuildTextChannelWithoutThreads,
    ApplicationCommandOptionTypes,
    ComponentTypes,
    type InteractionResolvedChannel,
    type MessageActionRow,
    MessageFlags,
    type Webhook
} from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import chunk from "chunk";
import assert from "node:assert";

export async function enableLogging(interaction: ComponentInteraction<ValidLocation.GUILD> | ModalSubmitInteraction<ValidLocation.GUILD>, channel: string, webhook: Webhook, event: LogEvents) {
    if (!interaction.acknowledged) {
        await interaction.defer(MessageFlags.EPHEMERAL);
    }
    await LogEvent.create({
        event,
        channel_id:    channel,
        webhook_id:    webhook.id,
        webhook_token: webhook.token!,
        guild_id:      interaction.guild.id
    });

    if (event === LogEvents.ALL) {
        const all = (await LogEvent.getAll(interaction.guildID)).filter(ev => ev.channelID === channel);
        for (const ev of all) {
            await ev.delete();
        }
    }

    const embed = Util.makeEmbed(true)
        .setTitle("Logging Enabled")
        .setDescription(`Logging of **${Util.readableConstant(LogEvents[event])}** has been enabled in this channel by ${interaction.user.mention}.`);
    if (webhook.avatar) {
        embed.setThumbnail(webhook.avatarURL()!);
    }
    await webhook.execute({
        embeds: embed.toJSON(true)
    });

    await interaction.editOriginal({
        content: `Logging of **${Util.readableConstant(LogEvents[event])}** has been enabled in <#${channel}> via **${webhook.name!}**.`
    });
}

export default new Command(import.meta.url, "logging")
    .setDescription("Manage the logging for this server")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "add")
            .setDescription("Add a logging entry.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "category")
                    .setDescription("The category of events to pick from.")
                    .setRequired()
                    .setChoices(LogCategoriesChoices)
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "event")
                    .setDescription("The event to log.")
                    .setRequired()
                    .setAutocomplete()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to log to. Defaults to the current channel.")
                    .setChannelTypes(TextableGuildChannels)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "clear")
            .setDescription("Clear all logging entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to clear. Defaults to global.")
                    .setChannelTypes(TextableGuildChannels)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List all logging entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to list. Defaults to global.")
                    .setChannelTypes(TextableGuildChannels)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "remove")
            .setDescription("Remove a logging entry.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "entry")
                    .setDescription("The entry to remove.")
                    .setRequired()
                    .setAutocomplete()
            )
    )
    .setOptionsParser(interaction => ({
        type:    interaction.data.options.getSubCommand<["add" | "clear" | "list" | "remove"]>(true)[0],
        event:   interaction.data.options.getString<keyof typeof LogEvents>("event"),
        channel: interaction.data.options.getChannel("channel") as InteractionResolvedChannel | AnyGuildTextChannelWithoutThreads,
        entry:   interaction.data.options.getString("entry")
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { type, event: rawEvent, channel, entry }) {
        if (channel && !TextableGuildChannels.includes(channel.type)) {
            return interaction.reply({
                content: `H-hey! <#${channel.id}> is not a valid textable channel..`
            });
        }
        switch (type) {
            case "add": {
                if (!channel) {
                    channel = interaction.channel as AnyGuildTextChannelWithoutThreads;
                }
                assert(rawEvent);
                if (!Object.hasOwn(LogEvents, rawEvent)) {
                    // Discord™️ - sometimes the name gets sent as the value
                    rawEvent = rawEvent.toUpperCase().replace(/\s/g, "_") as typeof rawEvent;
                }
                const event = LogEvents[rawEvent];
                const total = await LogEvent.getCount(interaction.guild.id);
                const events = await LogEvent.getAll(interaction.guild.id);
                if (total >= LogEvent.MAX_EVENTS) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of logging (${LogEvent.MAX_EVENTS}) enabled.. Remove some to add more.\n\n(Note: **All** counts as \`${LogEventsAllValue}\` entries)`
                    }));
                }

                const current = events.filter(ev => ev.event === event).length;
                if (event === LogEvents.ALL && current >= 1) {
                    return interaction.reply(Util.replaceContent({
                        content: "H-hey! You can only have 1 **All** at a time.."
                    }));
                }

                if (current >= LogEvent.MAX_EVENTS_PER_TYPE) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of logging for **${Util.readableConstant(LogEvents[event])}** enabled.. Remove some to add more.`
                    }));
                }

                if (current > 0 && events.some(ev => ev.event === event && ev.channelID === channel.id)) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has logging for **${Util.readableConstant(LogEvents[event])}** enabled in <#${channel.id}>..`
                    }));
                }

                const toAdd = event === LogEvents.ALL ? LogEventsAllValue : 1;
                if (total + toAdd > LogEvent.MAX_EVENTS) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! Adding that would put you over the logging limit (${LogEvent.MAX_EVENTS}).. Remove some to add it.\n\n(Note: **All** counts as \`${LogEventsAllValue}\` entries)`
                    }));
                }

                const components = new ComponentBuilder<MessageActionRow>()
                    .addInteractionButton({
                        customID: State.new(interaction.user.id, "logging", "create-webhook").with("channel", channel.id).with("event", event).encode(),
                        label:    "Create Webhook",
                        style:    ButtonColors.BLURPLE
                    });

                if (("appPermissions" in channel ? channel.appPermissions : channel.permissionsOf(this.user.id)).has("MANAGE_WEBHOOKS")) {
                    const webhooks = (await this.rest.webhooks.getForChannel(channel.id)).filter(hook => hook.name !== null && hook.token !== undefined);
                    if (webhooks.length !== 0) {
                        components.addSelectMenu({
                            customID: State.new(interaction.user.id, "logging", "select-webhook").with("channel", channel.id).with("event", event).encode(),
                            options:  webhooks.map(hook => ({ label: hook.name!, value: hook.id })),
                            type:     ComponentTypes.STRING_SELECT
                        });
                    }
                }

                return interaction.reply({
                    content:    `Please select an option for enabling the logging of **${Util.readableConstant(LogEvents[event])}** in <#${channel.id}>.`,
                    components: components.toJSON()
                });
            }

            case "clear": {
                const events = (await LogEvent.getAll(interaction.guild.id)).filter(ev => channel?.id ? ev.channelID === channel.id : true);
                if (events.length === 0) {
                    return interaction.reply({
                        content: "H-hey! There aren't any entries to clear.."
                    });
                }

                return interaction.reply({
                    content:    `Are you sure you want to clear **${events.length}** logging entries${channel ? ` in <#${channel.id}>` : ""}?`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "logging", "clear").with("channel", channel?.id ?? null).encode(),
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
                const events = (await LogEvent.getAll(interaction.guild.id)).filter(ev => channel?.id ? ev.channelID === channel.id : true);
                if (events.length === 0) {
                    return interaction.reply({
                        content: "H-hey! There aren't any entries to list.."
                    });
                }
                const list = chunk(events, 10);

                const page = 1;
                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setDescription(list[0].map(ev => `**${Util.readableConstant(LogEvents[ev.event])}** in <#${ev.channelID}>`).join("\n"))
                        .setColor(Colors.gold)
                        .setFooter(`Page ${page}/${list.length}`)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "logging", "nav").with("channel", channel?.id ?? null).with("page", page).with("dir", -1).encode(),
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
                            customID: State.new(interaction.user.id, "logging", "nav").with("channel", channel?.id ?? null).with("page", page).with("dir", 1).encode(),
                            disabled: (page + 1) > list.length,
                            label:    "Next Page",
                            style:    ButtonColors.BLURPLE
                        })
                        .toJSON()
                });
            }

            case "remove": {
                const event = await LogEvent.get(entry!);
                if (event === null) {
                    return interaction.reply({
                        content: "H-hey! That entry doesn't exist.."
                    });
                }

                return interaction.reply({
                    content:    `Are you sure you want to remove the logging of **${Util.readableConstant(LogEvents[event.event])}** in <#${event.channelID}>?`,
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "logging", "remove").with("entry", entry!).encode(),
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
