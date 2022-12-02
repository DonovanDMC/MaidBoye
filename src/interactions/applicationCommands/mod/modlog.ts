import Command, { ValidLocation } from "../../../util/cmd/Command.js";
import ModLogHandler from "../../../util/handlers/ModLogHandler.js";
import ModLog from "../../../db/Models/ModLog.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import { Strings } from "@uwu-codes/utils";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, MessageActionRow } from "oceanic.js";
import assert from "node:assert";

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
                            .setChoices([
                                {
                                    name:  "Case Editing Enabled",
                                    value: "case-editing-enabled"
                                },
                                {
                                    name:  "Case Deleting Enabled",
                                    value: "case-deleting-enabled"
                                },
                                {
                                    name:  "Modify Others Cases Enabled (Edit or Delete)",
                                    value: "modify-others-cases-enabled"
                                }
                            ])
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
                    .setRequired()
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
        channel:      interaction.data.options.getChannel("channel") || null,
        setting:      interaction.data.options.getString<"case-editing-enabled" | "case-deleting-enabled" | "modify-others-cases-enabled">("setting", false) || null,
        settingValue: interaction.data.options.getBoolean("value", false) || null,
        caseID:       interaction.data.options.getInteger("case", false) || null,
        reason:       interaction.data.options.getString("reason", false) || null
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { type: [type, configType], channel, setting, settingValue, caseID, reason }, gConfig) {
        if (gConfig.modlog.enabled && gConfig.modlog.webhook === null) {
            await gConfig.resetModLog();
        }
        switch (type) {
            case "config": {
                assert(configType);
                switch (configType) {
                    case "setup": {
                        assert(channel);
                        if (await ModLogHandler.check(gConfig)) {
                            return interaction.reply({ content: "H-hey! The modlog has already been set up. Reset it before changing it" });
                        }
                        break;
                    }

                    case "reset": {
                        if (!(await ModLogHandler.check(gConfig))) {
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
                                            customID: State.new(interaction.user.id, "modlog", "reset-confirm").with("hook", hook.id).encode(),
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
                        await gConfig.resetModLog();
                        return interaction.reply({ content: "The modlog has been reset." });
                    }

                    case "get": {
                        break;
                    }

                    case "set": {
                        assert(setting && settingValue);
                        switch (setting) {
                            case "case-editing-enabled": {
                                await gConfig.setSetting("MODLOG_CASE_EDITING_ENABLED", settingValue); break;
                            }
                            case "case-deleting-enabled": {
                                await gConfig.setSetting("MODLOG_CASE_DELETING_ENABLED", settingValue); break;
                            }
                            case "modify-others-cases-enabled": {
                                await gConfig.setSetting("MODLOG_MODIFY_OTHERS_CASES_ENABLED", settingValue); break;
                            }
                        }
                        break;
                    }
                }
                break;
            }

            case "edit-case": {
                assert(caseID && reason);
                reason = Strings.truncate(reason, 500);
                if (!(await ModLogHandler.check(gConfig))) {
                    return interaction.reply({ content: "H-hey! The modlog isn't enabled in this server, so cases can't be edited" });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR") && !gConfig.modlog.caseEditingEnabled) {
                    return interaction.reply({ content: "H-hey! Case editing is disabled in this server" });
                }
                const modCase = await ModLog.getCase(interaction.guildID, caseID);
                if (!modCase) {
                    return interaction.reply({ content: "H-hey! I couldn't find that case.." });
                }
                if (modCase.deleted) {
                    return interaction.reply({ content: "H-hey! That case has been deleted.." });
                }
                // we also enforce this for administrators as any edits would look as if they were specifically from us
                if (modCase.blameID === null || modCase.blameID === this.user.id) {
                    return interaction.reply({ content: "Cases for automatic actions cannot be edited." });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR") && modCase.blameID !== interaction.member.id && gConfig.modlog.modifyOthersCasesEnabled) {
                    return interaction.reply({ content: "H-hey! You can't edit cases that aren't yours" });
                }
                let messageUpdated = false;
                if (gConfig.modlog.webhook) {
                    const msg = await modCase.getMessage(this);
                    if (msg && msg.webhookID === gConfig.modlog.webhook.id) {
                        await this.rest.webhooks.editMessage(gConfig.modlog.webhook.id, gConfig.modlog.webhook.token, msg.id, {
                            embeds: Util.makeEmbed(false, undefined, msg.embeds[0])
                                .setDescription(
                                    msg.embeds[0].description!.split("\n").map(line => {
                                        if (line.startsWith("Reason: ")) {
                                            return `Reason: **${reason || "[None Provided]"}**`;
                                        }
                                        if (line.startsWith("Last Edit")) {
                                            return;
                                        }
                                        return line;
                                    }).filter(Boolean).join("\n"),
                                    `Last Edit: by <@!${interaction.user.id}> at ${Util.formatDiscordTime(Date.now(), "short-datetime", true)}`
                                )
                                .toJSON(true)
                        }).then(() => messageUpdated = true);
                    }
                }
                await modCase.edit({ updated_by: interaction.user.id, reason });
                return interaction.reply({ content: `Case #${caseID} has been updated.${messageUpdated ? "" : " Due to a lookup failure, the modlog message has not been edited."}` });
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
