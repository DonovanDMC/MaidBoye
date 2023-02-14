import Command, { type ComponentInteraction, type ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import ModLog from "../../../db/Models/ModLog.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import GuildConfig, { ModlogSettingChoices, ModlogSettingKeys, ModlogSettingNames } from "../../../db/Models/GuildConfig.js";
import { TextableGuildChannels } from "../../../util/Constants.js";
import Config from "../../../config/index.js";
import { SettingsBits } from "../../../util/settings/index.js";
import { Strings } from "@uwu-codes/utils";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import {
    ApplicationCommandOptionTypes,
    type Webhook,
    type MessageActionRow,
    type InteractionResolvedChannel,
    type AnyGuildTextChannelWithoutThreads,
    ComponentTypes
} from "oceanic.js";
import assert from "node:assert";

export async function enableModlog(interaction: ComponentInteraction<ValidLocation.GUILD> | ModalSubmitInteraction<ValidLocation.GUILD>, channel: string, webhook: Webhook) {
    const gConfig = await GuildConfig.get(interaction.guildID);
    await gConfig.setModLog(webhook.id, webhook.token!, channel, webhook.applicationID === interaction.client.user.id);

    const embed = Util.makeEmbed(true)
        .setTitle("ModLog Enabled")
        .setDescription(`The modlog has been enabled in this channel by ${interaction.user.mention}.`);
    if (webhook.avatar) {
        embed.setThumbnail(webhook.avatarURL()!);
    }
    await webhook.execute({
        embeds: embed.toJSON(true)
    });

    await interaction.editParent(Util.replaceContent({
        content: `ModLog enabled in <#${channel}> via **${webhook.name!}**.`
    }));
}

export default new Command(import.meta.url, "modlog")
    .setDescription("Manage this server's modlog")
    .setPermissions("user", "MANAGE_GUILD")
    .setPermissions("bot", "MANAGE_CHANNELS", "MANAGE_WEBHOOKS")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, "config")
            .setDescription("Configure the modlog")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "setup")
                    .setDescription("Set the webhook used for the modlog")
                    .addOption(
                        new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                            .setDescription("The channel to setup the modlog in. Defaults to the current channel.")
                            .setChannelTypes(TextableGuildChannels)
                    )
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "reset")
                    .setDescription("Reset the modlog configuration")
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "get")
                    .setDescription("Get the current modlog configuration")
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "set")
                    .setDescription("Set a modlog setting")
                    .addOption(
                        new Command.Option(ApplicationCommandOptionTypes.STRING, "setting")
                            .setDescription("The setting to edit. Administrators bypass all of these")
                            .setChoices(ModlogSettingChoices)
                            .setRequired()
                    )
                    .addOption(
                        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "value")
                            .setDescription("The value of the setting")
                            .setRequired()
                    )
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "edit-case")
            .setDescription("Edit the reason of an existing case")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "case")
                    .setDescription("The case to edit")
                    .setAutocomplete()
                    .setRequired()
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.STRING, "reason")
                    .setDescription("The new reason for the case")
                    .setMinMax(1, 500)
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "reason-hidden")
                    .setDescription("If we should hide the reason from non-moderators (permission: MANAGE_GUILD)")
            )
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "delete-case")
            .setDescription("Delete an existing case")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.INTEGER, "case")
                    .setDescription("The case to delete")
                    .setAutocomplete()
                    .setRequired()
            )
    )
    .setOptionsParser(interaction => ({
        type:         interaction.data.options.getSubCommand<["config", "setup" | "reset" | "get" | "set"] | ["edit-case"] | ["delete-case"]>(true),
        channel:      interaction.data.options.getChannel("channel") as InteractionResolvedChannel | AnyGuildTextChannelWithoutThreads ?? null,
        setting:      interaction.data.options.getString<typeof ModlogSettingKeys[number]>("setting", false) ?? null,
        settingValue: interaction.data.options.getBoolean("value", false) ?? null,
        caseID:       interaction.data.options.getInteger("case", false) ?? null,
        reason:       interaction.data.options.getString("reason", false),
        reasonHidden: interaction.data.options.getBoolean("reason-hidden", false)
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { type: [type, configType], channel, setting, settingValue, caseID, reason, reasonHidden }, gConfig) {
        const enabled = await ModLogHandler.check(gConfig);
        if (channel && !TextableGuildChannels.includes(channel.type)) {
            return interaction.reply({
                content: `H-hey! <#${channel.id}> is not a valid textable channel..`
            });
        }
        switch (type) {
            case "config": {
                assert(configType);
                switch (configType) {
                    case "setup": {
                        if (!channel) {
                            channel = interaction.channel as AnyGuildTextChannelWithoutThreads;
                        }
                        if (enabled) {
                            return interaction.reply({ content: "H-hey! The modlog has already been set up. Reset it before changing it" });
                        }


                        const components = new ComponentBuilder<MessageActionRow>()
                            .addInteractionButton({
                                customID: State.new(interaction.user.id, "modlog", "create-webhook").with("channel", channel.id).encode(),
                                label:    "Create Webhook",
                                style:    ButtonColors.BLURPLE
                            });

                        if (("appPermissions" in channel ? channel.appPermissions : channel.permissionsOf(this.user.id)).has("MANAGE_WEBHOOKS")) {
                            const webhooks = (await this.rest.webhooks.getForChannel(channel.id)).filter(hook => hook.name !== null && hook.token !== undefined);
                            if (webhooks.length !== 0) {
                                components.addSelectMenu({
                                    customID: State.new(interaction.user.id, "modlog", "select-webhook").with("channel", channel.id).encode(),
                                    options:  webhooks.map(hook => ({ label: hook.name!, value: hook.id })),
                                    type:     ComponentTypes.STRING_SELECT
                                });
                            }
                        }

                        return interaction.reply({
                            content:    `Please select an option for enabling the modlog in <#${channel.id}>.`,
                            components: components.toJSON()
                        });
                    }

                    case "reset": {
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The modlog is not enabled.." });
                        }
                        if (gConfig.modlog.webhook) {
                            const hook = await this.rest.webhooks.get(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token);
                            if (hook) {
                                return interaction.reply({
                                    embeds: Util.makeEmbed(true, interaction.user)
                                        .setTitle("Delete Webhook")
                                        .setDescription(`The webhook **${hook.name || hook.id}** that was used for the modlog is managed by us, would you like to delete it?`)
                                        .setThumbnail(hook.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
                                        .toJSON(true),
                                    components: new ComponentBuilder<MessageActionRow>()
                                        .addInteractionButton({
                                            customID: State.new(interaction.user.id, "modlog", "reset").with("hook", hook.id).encode(),
                                            label:    "Yes",
                                            style:    ButtonColors.GREEN
                                        })
                                        .addInteractionButton({
                                            customID: State.new(interaction.user.id, "modlog", "reset").with("hook", null).encode(),
                                            label:    "No",
                                            style:    ButtonColors.BLURPLE
                                        })
                                        .addInteractionButton({
                                            customID: State.cancel(interaction.user.id),
                                            label:    "Cancel",
                                            style:    ButtonColors.RED
                                        })
                                        .toJSON()
                                });
                            }
                        }
                        await gConfig.resetModLog();
                        return interaction.reply({ content: "The modlog has been reset." });
                    }

                    case "get": {
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The modlog isn't enabled in this server.." });
                        }
                        assert(gConfig.modlog.webhook, `welcome.modlog null when modlog is enabled (guild: ${interaction.guildID})`);
                        const hook = await this.rest.webhooks.get(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token).catch(() => null);

                        const settings = Util.getFlagsArray(SettingsBits, BigInt(gConfig._data.settings));
                        return interaction.reply({
                            embeds: Util.makeEmbed(true, interaction.user)
                                .setTitle("Modlog Configuration")
                                .setDescription([
                                    `Channel: <#${gConfig.modlog.webhook.channelID}>`,
                                    `Webhook: ${hook ? `**${hook.name ?? hook.id}**` : "Unknown"}`,
                                    "**Settings**:",
                                    ...Object.entries(ModlogSettingNames).map(([value, name]) => `${Config.emojis.default.dot} ${name}: ${settings.includes(value as typeof ModlogSettingKeys[number]) ? "Enabled" : "Disabled"}`)
                                ])
                                .setThumbnail(hook?.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
                                .toJSON(true)
                        });
                    }

                    case "set": {
                        assert(setting !== null && settingValue !== null);
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The modlog isn't enabled in this server, so settings can't be changed." });
                        }

                        if (!ModlogSettingKeys.includes(setting)) {
                            return interaction.reply({ content: "H-hey! That isn't a valid setting.." });
                        }
                        await gConfig.setSetting(setting, settingValue);

                        return interaction.reply({ content: `The setting **${ModlogSettingNames[setting]}** has been ${settingValue ? "enabled" : "disabled"}.` });
                    }
                }
                // @ts-expect-error this is unreachable as eslint reports, but typescript complains about switch case fallthrough
                break;
            }

            case "edit-case": {
                if (!(await ModLogHandler.check(gConfig))) {
                    return interaction.reply({ content: "H-hey! The modlog isn't enabled in this server, so cases can't be edited" });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR") && !gConfig.modlog.caseEditingEnabled) {
                    return interaction.reply({ content: "H-hey! Case editing is disabled in this server" });
                }
                if (reason === undefined && reasonHidden === undefined) {
                    return interaction.reply({ content: "H-hey! You need to provide something to edit.." });
                }
                if (reasonHidden !== undefined && !interaction.member.permissions.has("ADMINISTRATOR")) {
                    return interaction.reply({ content: "H-hey! You must be an administrator to edit that on existing cases." });
                }
                const modCase = await ModLog.getCase(interaction.guildID, caseID!);

                if (!modCase) {
                    return interaction.reply({ content: "H-hey! I couldn't find that case.." });
                }
                if (modCase.deleted) {
                    return interaction.reply({ content: "H-hey! That case has been deleted.." });
                }

                if (reason !== undefined) {
                // we also enforce this for administrators as any edits would look as if they were specifically from us
                    if ((modCase.blameID === null || modCase.blameID === this.user.id)) {
                        return interaction.reply({ content: "The reason for cases relating to automatic actions cannot be edited." });
                    }

                    reason = Strings.truncate(reason, 500);
                    if (!interaction.member.permissions.has("ADMINISTRATOR") && modCase.blameID !== interaction.member.id && gConfig.modlog.modifyOthersCasesEnabled) {
                        return interaction.reply({ content: "H-hey! You can't edit cases that aren't yours" });
                    }
                }
                let messageUpdated = false;
                if (gConfig.modlog.webhook) {
                    const msg = await modCase.getMessage(this);
                    const shouldShow = reasonHidden === false || (reasonHidden === undefined && !modCase.reasonHidden);
                    if (msg && msg.webhookID === gConfig.modlog.webhook.id) {
                        let footer = msg.embeds[0].footer!.text;
                        if (footer.includes(" | Reason Hidden")) {
                            footer = reasonHidden === false ? footer.replace(" | Reason Hidden", "") : footer;
                        } else {
                            footer = reasonHidden === true ? `${footer} | Reason Hidden` : footer;
                        }
                        await this.rest.webhooks.editMessage(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token, msg.id, {
                            embeds: Util.makeEmbed(false, undefined, msg.embeds[0])
                                .setDescription(
                                    msg.embeds[0].description!.split("\n").map(line => {
                                        if (line.startsWith("Reason: ")) {
                                            return `Reason: **${shouldShow ? reason ?? modCase.reason : "[HIDDEN]"}**`;
                                        }
                                        if (line.startsWith("Last Edit")) {
                                            return;
                                        }
                                        return line;
                                    }).filter(Boolean).join("\n"),
                                    `Last Edit: by <@!${interaction.user.id}> at ${Util.formatDiscordTime(Date.now(), "short-datetime", true)}`
                                )
                                .setFooter(footer, msg.embeds[0].footer!.iconURL)
                                .toJSON(true)
                        }).then(() => messageUpdated = true);
                    }
                }
                await modCase.edit({ updated_by: interaction.user.id, reason, reason_hidden: reasonHidden });
                return interaction.reply({ content: `Case #${caseID!} has been updated.${messageUpdated ? "" : " Due to a lookup failure, the modlog message has not been edited."}` });
            }

            case "delete-case": {
                assert(caseID);
                if (!(await ModLogHandler.check(gConfig))) {
                    return interaction.reply({ content: "H-hey! The modlog isn't enabled in this server, so cases can't be deleted" });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR") && !gConfig.modlog.caseDeletingEnabled) {
                    return interaction.reply({ content: "H-hey! Case deleting is disabled in this server" });
                }
                const modCase = await ModLog.getCase(interaction.guildID, caseID);
                if (!modCase) {
                    return interaction.reply({ content: "H-hey! I couldn't find that case.." });
                }
                if (modCase.deleted) {
                    return interaction.reply({ content: "H-hey! That case has been deleted.." });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR") && modCase.blameID !== interaction.member.id && gConfig.modlog.modifyOthersCasesEnabled) {
                    return interaction.reply({ content: "H-hey! You can't delete cases that aren't yours" });
                }
                let messageDeleted = false;
                if (gConfig.modlog.webhook) {
                    const msg = await modCase.getMessage(this);
                    if (msg && msg.webhookID === gConfig.modlog.webhook.id) {
                        await this.rest.webhooks.deleteMessage(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token, msg.id).then(() => messageDeleted = true);
                    }
                }
                await modCase.edit({ updated_by: interaction.user.id, deleted: true });
                return interaction.reply({ content: `Case #${caseID} has been deleted.${messageDeleted ? "" : " Due to a lookup failure, the modlog message has not been deleted."}` });
            }
        }
    });
