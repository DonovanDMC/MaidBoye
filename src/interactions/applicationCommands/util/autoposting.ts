import Command, { ComponentInteraction, ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import { Colors, TextableGuildChannels } from "../../../util/Constants.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import AutoPostingEntry, { AutoPostingCategoryChoices, AutoPostingNSFW, AutoPostingTypes, ValidAutoPostingTimes } from "../../../db/Models/AutoPostingEntry.js";
import {
    AnyGuildTextChannelWithoutThreads,
    ApplicationCommandOptionTypes,
    ComponentTypes,
    InteractionResolvedChannel,
    MessageActionRow,
    MessageFlags,
    Webhook
} from "oceanic.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import chunk from "chunk";
import assert from "node:assert";

export async function enableAutoposting(interaction: ComponentInteraction<ValidLocation.GUILD> | ModalSubmitInteraction<ValidLocation.GUILD>, channel: string, webhook: Webhook, type: AutoPostingTypes, time: number) {
    if (!interaction.acknowledged) {
        await interaction.defer(MessageFlags.EPHEMERAL);
    }
    await AutoPostingEntry.create({
        type,
        time:          time as 5,
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

    await interaction.editOriginal({
        content: `Autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** has been enabled every **${time} Minutes** in <#${channel}> via **${webhook.name!}**.`
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
                    .setChannelTypes(TextableGuildChannels)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "clear")
            .setDescription("Clear all autoposting entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to clear. Defaults to global.")
                    .setChannelTypes(TextableGuildChannels)
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "list")
            .setDescription("List all autoposting entries.")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                    .setDescription("The channel to list. Defaults to global.")
                    .setChannelTypes(TextableGuildChannels)
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
    .setOptionsParser(interaction => ({
        sub:     interaction.data.options.getSubCommand<["add" | "clear" | "list" | "remove"]>(true)[0],
        type:    interaction.data.options.getString<keyof typeof AutoPostingTypes>("type"),
        channel: interaction.data.options.getChannel("channel") as InteractionResolvedChannel | AnyGuildTextChannelWithoutThreads,
        entry:   interaction.data.options.getString("entry"),
        time:    interaction.data.options.getNumber("time")
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setExecutor(async function(interaction, { sub, type: rawType, channel, entry, time }) {
        if (channel && !TextableGuildChannels.includes(channel.type)) {
            return interaction.reply({
                content: `H-hey! <#${channel.id}> is not a valid textable channel..`
            });
        }
        if (time && !ValidAutoPostingTimes.includes(time as 5)) {
            return interaction.reply({
                content: `H-hey! **${time}** is not a valid autoposting time..`
            });
        }
        switch (sub) {
            case "add": {
                assert(rawType);
                if (!channel) {
                    channel = interaction.channel as AnyGuildTextChannelWithoutThreads;
                }
                if (!time) {
                    time = 60;
                }
                if (!Object.hasOwn(AutoPostingTypes, rawType)) {
                    // Discord™️ - sometimes the name gets sent as the value
                    rawType = rawType.toUpperCase().replace(/\s/g, "_") as typeof rawType;
                }
                const type = AutoPostingTypes[rawType];
                const total = await AutoPostingEntry.getCount(interaction.guild.id);
                const autos = await AutoPostingEntry.getAll(interaction.guild.id);
                if (total >= AutoPostingEntry.MAX_ENTRIES) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of autoposting (${AutoPostingEntry.MAX_ENTRIES}) enabled.. Remove some to add more.`
                    }));
                }

                const current = autos.filter(ev => ev.type === type).length;

                if (current >= AutoPostingEntry.MAX_ENTRIES_PER_TYPE) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has the maximum amount of autoposting for **${Util.readableConstant(AutoPostingTypes[type])}** enabled.. Remove some to add more.`
                    }));
                }

                if (current > 0 && autos.some(ev => ev.type === type && ev.channelID === channel.id)) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! This server already has autoposting for **${Util.readableConstant(AutoPostingTypes[type])}** enabled in <#${channel.id}>..`
                    }));
                }

                if (total + 1 > AutoPostingEntry.MAX_ENTRIES) {
                    return interaction.reply(Util.replaceContent({
                        content: `H-hey! Adding that would put you over the autoposting limit (${AutoPostingEntry.MAX_ENTRIES}).. Remove some to add it.`
                    }));
                }

                if (AutoPostingNSFW.includes(type) && !(channel instanceof InteractionResolvedChannel ? (channel.completeChannel as AnyGuildTextChannelWithoutThreads | undefined)?.nsfw ?? false : channel.nsfw)) {
                    return interaction.reply({
                        content: `H-hey! Autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** must be done in an nsfw channel.`
                    });
                }

                const components = new ComponentBuilder<MessageActionRow>()
                    .addInteractionButton({
                        customID: State.new(interaction.user.id, "autoposting", "create-webhook").with("channel", channel.id).with("type", type).with("time", time).encode(),
                        label:    "Create Webhook",
                        style:    ButtonColors.BLURPLE
                    });

                if (("appPermissions" in channel ? channel.appPermissions : channel.permissionsOf(this.user.id)).has("MANAGE_WEBHOOKS")) {
                    const webhooks = (await this.rest.webhooks.getForChannel(channel.id)).filter(hook => hook.name !== null && hook.token !== undefined);
                    if (webhooks.length !== 0) {
                        components.addSelectMenu({
                            customID: State.new(interaction.user.id, "autoposting", "select-webhook").with("channel", channel.id).with("type", type).with("time", time).encode(),
                            options:  webhooks.map(hook => ({ label: hook.name!, value: hook.id })),
                            type:     ComponentTypes.STRING_SELECT
                        });
                    }
                }

                return interaction.reply({
                    content:    `Please select an option for enabling the autoposting of **${Util.readableConstant(AutoPostingTypes[type])}** in <#${channel.id}>.`,
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
                const autos = (await AutoPostingEntry.getAll(interaction.guild.id)).filter(ev => channel?.id ? ev.channelID === channel.id : true);
                if (autos.length === 0) {
                    return interaction.reply({
                        content: "H-hey! There aren't any entries to list.."
                    });
                }
                const list = chunk(autos, 10);

                const page = 1;
                return interaction.reply({
                    embeds: Util.makeEmbed(true, interaction.user)
                        .setDescription(list[0].map(a => `**${Util.readableConstant(AutoPostingTypes[a.type])}** in <#${a.channelID}>`).join("\n"))
                        .setColor(Colors.gold)
                        .setFooter(`Page ${page}/${list.length}`)
                        .toJSON(true),
                    components: new ComponentBuilder<MessageActionRow>()
                        .addInteractionButton({
                            customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel?.id ?? null).with("page", page).with("dir", -1).encode(),
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
                            customID: State.new(interaction.user.id, "autoposting", "nav").with("channel", channel?.id ?? null).with("page", page).with("dir", 1).encode(),
                            disabled: (page + 1) > list.length,
                            label:    "Next Page",
                            style:    ButtonColors.BLURPLE
                        })
                        .toJSON()
                });
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
                            customID: State.new(interaction.user.id, "autoposting", "remove").with("entry", entry!).encode(),
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
