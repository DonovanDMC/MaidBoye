import Command, { type ComponentInteraction, type ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import { State } from "../../../util/State.js";
import GuildConfig, { GuildWelcomeModifierKeys, GuildWelcomeModifiersChoices  } from "../../../db/Models/GuildConfig.js";
import WelcomeMessageHandler, { Replacements } from "../../../util/handlers/WelcomeMessageHandler.js";
import Config from "../../../config/index.js";
import { TextableGuildChannels } from "../../../util/Constants.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import {
    type AnyGuildTextChannelWithoutThreads,
    ApplicationCommandOptionTypes,
    type MessageActionRow,
    type InteractionResolvedChannel,
    ComponentTypes,
    type Webhook
} from "oceanic.js";
import { Strings } from "@uwu-codes/utils";
import assert from "node:assert";

export const badgesLink = "https://github.com/DonovanDMC/MaidBoye/blob/e41e140c7551d4b0417f6471b2c5a36b0a229d1c/src/util/Names.ts#L46-L62";
export const flagsLink = "https://github.com/DonovanDMC/MaidBoye/blob/e41e140c7551d4b0417f6471b2c5a36b0a229d1c/src/util/Names.ts#L482-L485";
export async function enableWelcome(interaction: ComponentInteraction<ValidLocation.GUILD> | ModalSubmitInteraction<ValidLocation.GUILD>, channel: string, webhook: Webhook) {

    const gConfig = await GuildConfig.get(interaction.guildID);
    await gConfig.setWelcome(webhook.id, webhook.token!, channel, webhook.applicationID === interaction.client.user.id);

    const embed = Util.makeEmbed(true)
        .setTitle("Welcome Enabled")
        .setDescription(`The welcome message has been enabled in this channel by ${interaction.user.mention}.`);
    if (webhook.avatar) {
        embed.setThumbnail(webhook.avatarURL()!);
    }
    await webhook.execute({
        embeds: embed.toJSON(true)
    });

    await interaction.editParent(Util.replaceContent({
        content: `Welcome message enabled in <#${channel}> via **${webhook.name!}**.`
    }));
}

export default new Command(import.meta.url, "welcome")
    .setDescription("Manage this server's welcome message")
    .setPermissions("user", "MANAGE_GUILD")
    .setPermissions("bot", "MANAGE_CHANNELS", "MANAGE_WEBHOOKS")
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "setup")
        .setDescription("Set up the welcome message")
        .addOption(
            new Command.Option(ApplicationCommandOptionTypes.CHANNEL, "channel")
                .setDescription("The channel to send the welcome message in. Defaults to the current channel.")
                .setChannelTypes(TextableGuildChannels)
        )
    )
    .addOption(new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "reset")
        .setDescription("Reset the welcome message configuration")
    )
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND_GROUP, "config")
            .setDescription("Configure the welcome message")
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "message")
                    .setDescription("Set the welcome message. You will be prompted with a more in-depth editing menu.")
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "set-modifier")
                    .setDescription("Edit the welcome message modifiers")
                    .addOption(
                        new Command.Option(ApplicationCommandOptionTypes.STRING, "modifier")
                            .setDescription("The modifier to change")
                            .setChoices(GuildWelcomeModifiersChoices)
                            .setRequired()
                    )
                    .addOption(
                        new Command.Option(ApplicationCommandOptionTypes.BOOLEAN, "value")
                            .setDescription("The new value for the modifier")
                            .setRequired()
                    )
            )
            .addOption(
                new Command.Option(ApplicationCommandOptionTypes.SUB_COMMAND, "get")
                    .setDescription("Get the welcome message configuration")
            )
    )
    .setOptionsParser(interaction => ({
        type:          interaction.data.options.getSubCommand<["config", "message" | "set-modifier" | "get"] | ["setup" | "reset"]>(true),
        channel:       interaction.data.options.getChannel("channel") as InteractionResolvedChannel | AnyGuildTextChannelWithoutThreads ?? null,
        modifier:      interaction.data.options.getString<typeof GuildWelcomeModifierKeys[number]>("modifier", false) ?? null,
        modifierValue: interaction.data.options.getBoolean("value", false) ?? null
    }))
    .setValidLocation(ValidLocation.GUILD)
    .setAck("ephemeral")
    .setGuildLookup(true)
    .setExecutor(async function(interaction, { type: [type, configType], channel, modifier, modifierValue }, gConfig) {
        const enabled = await WelcomeMessageHandler.check(gConfig);
        if (channel && !TextableGuildChannels.includes(channel.type)) {
            return interaction.reply({
                content: `H-hey! <#${channel.id}> is not a valid textable channel..`
            });
        }
        switch (type) {
            case "setup": {
                if (!channel) {
                    channel = interaction.channel as AnyGuildTextChannelWithoutThreads;
                }
                if (enabled) {
                    return interaction.reply({ content: "H-hey! The welcome message has already been set up. Reset it before changing it" });
                }

                const components = new ComponentBuilder<MessageActionRow>()
                    .addInteractionButton({
                        customID: State.new(interaction.user.id, "welcome", "create-webhook").with("channel", channel.id).encode(),
                        label:    "Create Webhook",
                        style:    ButtonColors.BLURPLE
                    });

                if (("appPermissions" in channel ? channel.appPermissions : channel.permissionsOf(this.user.id)).has("MANAGE_WEBHOOKS")) {
                    const webhooks = (await this.rest.webhooks.getForChannel(channel.id)).filter(hook => hook.name !== null && hook.token !== undefined);
                    if (webhooks.length !== 0) {
                        components.addSelectMenu({
                            customID: State.new(interaction.user.id, "welcome", "select-webhook").with("channel", channel.id).encode(),
                            options:  webhooks.map(hook => ({ label: hook.name!, value: hook.id })),
                            type:     ComponentTypes.STRING_SELECT
                        });
                    }
                }

                return interaction.reply({
                    content:    `Please select an option for sending the welcome message in <#${channel.id}>.`,
                    components: components.toJSON()
                });
            }

            case "reset": {
                if (!enabled) {
                    return interaction.reply({ content: "H-hey! The welcome message is not enabled.." });
                }
                if (gConfig.welcome.webhook) {
                    const hook = await this.rest.webhooks.get(gConfig.welcome.webhook.id, gConfig.welcome.webhook.token);
                    if (hook) {
                        return interaction.reply({
                            embeds: Util.makeEmbed(true, interaction.user)
                                .setTitle("Delete Webhook")
                                .setDescription(`The webhook **${hook.name || hook.id}** that was used for the welcome is managed by us, would you like to delete it?`)
                                .setThumbnail(hook.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
                                .toJSON(true),
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "welcome", "reset").with("hook", hook.id).encode(),
                                    label:    "Yes",
                                    style:    ButtonColors.GREEN
                                })
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "welcome", "reset").with("hook", null).encode(),
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
                await gConfig.resetWelcome();
                return interaction.reply({ content: "The welcome message has been reset." });
            }

            case "config": {
                assert(configType);
                switch (configType) {
                    case "message": {
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The welcome message is not enabled.." });
                        }

                        const map = Replacements(interaction.member);
                        const commandID = (await this.getCommandIDMap()).chatInput.welcome;
                        return interaction.reply({
                            embeds: Util.makeEmbed(true, interaction.user)
                                .setTitle("Welcome Message Editor")
                                .setDescription([
                                    "The welcome message can be a maximum of 500 characters. The following variables can be used:",
                                    ...Object.entries(map).map(([k, v]) => `${Config.emojis.default.dot} **${k}** - ${v}`),
                                    "",
                                    `Modifiers like enabling mentions and disabling embeds can be toggled via ${commandID ? `</welcome config modifiers:${commandID}>` : "/welcome config modifiers"}. Note that the modifiers apply to both join and leave messages. For ease of use, the toggling of join/leave messages is considered a modifier. Note for [badges](${badgesLink}) and [flags](${flagsLink}), this is the same list that is shown in the member add/remove logging. You can see the possible list by clicking on the respective links.`,
                                    "Click below to edit the welcome message. A preview will be shown before anything is saved."
                                ])
                                .toJSON(true),
                            components: new ComponentBuilder<MessageActionRow>()
                                .addInteractionButton({
                                    customID: State.new(interaction.user.id, "welcome", "edit-message").encode(),
                                    label:    "Start Editing",
                                    style:    ButtonColors.GREEN
                                })
                                .addInteractionButton({
                                    customID: State.cancel(interaction.user.id),
                                    label:    "Cancel",
                                    style:    ButtonColors.RED
                                })
                                .toJSON()
                        });
                    }

                    case "set-modifier": {
                        assert(modifier !== null && modifierValue !== null);
                        if (!GuildWelcomeModifierKeys.includes(modifier)) {
                            return interaction.reply({ content: "H-hey! That isn't a valid modifier.." });
                        }
                        await gConfig.setWelcomeModifier(modifier, modifierValue);
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The welcome message is not enabled, so modifiers can't be edited." });
                        }

                        return interaction.reply({
                            content: `The modifier **${Strings.ucwords(modifier.replaceAll("_", " "))}** has been ${modifierValue ? "enabled" : "disabled"}.`
                        });
                    }

                    case "get": {
                        if (!enabled) {
                            return interaction.reply({ content: "H-hey! The welcome message is not enabled.." });
                        }
                        assert(gConfig.welcome.webhook, `welcome.webhook null when welcome is enabled (guild: ${interaction.guildID})`);
                        const hook = await this.rest.webhooks.get(gConfig.welcome.webhook.id, gConfig.welcome.webhook.token).catch(() => null);

                        return interaction.reply({
                            embeds: Util.makeEmbed(true, interaction.user)
                                .setTitle("Welcome Message Configuration")
                                .setDescription([
                                    `Channel: <#${gConfig.welcome.webhook.channelID ?? "Unknown"}>`,
                                    `Webhook: ${hook ? `**${hook.name ?? hook.id}**` : "Unknown"}`
                                ])
                                .addField("Modifiers", gConfig.welcome.modifiers.map(mod => `${Config.emojis.default.dot} **${Strings.ucwords(mod.replaceAll("_", " "))}**`).join("\n") || "None", false)
                                .addField("Raw Join Message", `\`\`\`\n${gConfig.welcome.joinMessage}\`\`\``, false)
                                .addField("Message Join Preview", WelcomeMessageHandler.format(gConfig, interaction.member, "join").content, false)
                                .addField("Raw Leave Message", `\`\`\`\n${gConfig.welcome.leaveMessage}\`\`\``, false)
                                .addField("Message Leave Preview", WelcomeMessageHandler.format(gConfig, interaction.member, "leave").content, false)
                                .setThumbnail(hook?.avatarURL() || "https://cdn.discordapp.com/embed/avatars/0.png")
                                .toJSON(true)
                        });
                    }
                }
            }
        }
    });
