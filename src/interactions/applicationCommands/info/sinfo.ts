import Command, { type CommandInteraction, type ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type MaidBoye from "../../../main.js";
import {
    DefaultMessageNotificationLevelNames,
    ExplicitContentFilterLevelNames,
    getFeatureName,
    GuildNSFWLevelNames,
    MFALevelNames,
    PremiumTierNames,
    VerificationLevelNames
} from "../../../util/Names.js";
import { State } from "../../../util/State.js";
import Config from "../../../config/index.js";
import { ButtonColors, ComponentBuilder } from "@oceanicjs/builders";
import { ApplicationCommandOptionTypes, ChannelTypes, type InteractionContent, type MessageActionRow } from "oceanic.js";

export type SectionNames = keyof Awaited<ReturnType<typeof generateSections>>;
export async function generateSections(this: MaidBoye, interaction: CommandInteraction<ValidLocation.GUILD> | ComponentInteraction<ValidLocation.GUILD>) {
    const o = interaction.guild.ownerID === null ? null : await this.getUser(interaction.guild.ownerID);
    const owner = o === null ? (interaction.guild.ownerID === null ? "Unknown" : `Unknown#0000 (**${interaction.guild.ownerID}**)`) : `**${o.username}#${o.discriminator}** (${o.id})`;

    const icon = interaction.guild.iconURL();
    return {
        // home
        server: {
            embeds: Util.makeEmbed(true)
                .setTitle(`Server Info - **${interaction.guild.name}**`)
                .setDescription(
                    "**Server**:",
                    `${Config.emojis.default.dot} Name: **${interaction.guild.name}**`,
                    `${Config.emojis.default.dot} ID: **${interaction.guildID}**`,
                    `${Config.emojis.default.dot} Owner: ${owner}`,
                    `${Config.emojis.default.dot} Creation Date: ${Util.formatDiscordTime(interaction.guild.createdAt, "long-datetime", true)}`,
                    `${Config.emojis.default.dot} Boosts: **${interaction.guild.premiumSubscriptionCount || "None"}**${interaction.guild.premiumSubscriptionCount ? ` (**${PremiumTierNames[interaction.guild.premiumTier]}**)` : ""}`,
                    `${Config.emojis.default.dot} Large: **${interaction.guild.large ? "Yes" : "No"}**`,
                    `${Config.emojis.default.dot} Verification Level: **${VerificationLevelNames[interaction.guild.verificationLevel]}**`,
                    `${Config.emojis.default.dot} 2FA Requirement: **${MFALevelNames[interaction.guild.mfaLevel]}**`,
                    `${Config.emojis.default.dot} Explicit Content Filter: **${ExplicitContentFilterLevelNames[interaction.guild.explicitContentFilter]}**`,
                    `${Config.emojis.default.dot} Default Notifications: **${DefaultMessageNotificationLevelNames[interaction.guild.defaultMessageNotifications]}**`,
                    `${Config.emojis.default.dot} Vanity URL: **${interaction.guild.features.includes("VANITY_URL") && interaction.guild.vanityURLCode !== null ? `https://discord.gg/${interaction.guild.vanityURLCode}` : "None"}**`,
                    `${Config.emojis.default.dot} NSFW level: **${GuildNSFWLevelNames[interaction.guild.nsfwLevel]}**`,
                    `${Config.emojis.default.dot} Members: **${interaction.guild.memberCount}**`,
                    `${Config.emojis.default.dot} Locale: **${interaction.guild.preferredLocale || "NONE"}**`,
                    `${Config.emojis.default.dot} Max Members: **${interaction.guild.maxMembers?.toLocaleString() || "NONE"}**`,
                    "",
                    "**Features**:",
                    interaction.guild.features.length === 0 ? `${Config.emojis.default.dot} NONE` : interaction.guild.features.map(f => `${Config.emojis.default.dot} ${getFeatureName(f)}`)
                )
                .setThumbnail(icon ?? "")
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "channels").encode(),
                    label:    "Channels",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "icon").encode(),
                    label:    "Icon",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "splash").encode(),
                    label:    "Splash",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "banner").encode(),
                    label:    "Banner",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "discovery").encode(),
                    label:    "Discovery",
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent,
        channels: {
            embeds: Util.makeEmbed(true)
                .setTitle(`Server Info - **${interaction.guild.name}**`)
                .setDescription(
                    "**Channels**:",
                    `${Config.emojis.default.dot} Total: ${interaction.guild.channels.size}`,
                    `${Config.emojis.default.dot} Text: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_TEXT).length}`,
                    `${Config.emojis.default.dot} Voice: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_VOICE).length}`,
                    `${Config.emojis.default.dot} Category: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_CATEGORY).length}`,
                    `${Config.emojis.default.dot} News: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_ANNOUNCEMENT).length}`,
                    `${Config.emojis.default.dot} Stage: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_STAGE_VOICE).length}`,
                    `${Config.emojis.default.dot} Forum: ${interaction.guild.channels.filter(c => c.type === ChannelTypes.GUILD_FORUM).length}`,
                    "",
                    "**Threads**:",
                    `${Config.emojis.default.dot} Total: ${interaction.guild.threads.size}`,
                    `${Config.emojis.default.dot} Announcement: ${interaction.guild.threads.filter(c => c.type === ChannelTypes.ANNOUNCEMENT_THREAD).length}`,
                    `${Config.emojis.default.dot} Public: ${interaction.guild.threads.filter(c => c.type === ChannelTypes.PUBLIC_THREAD).length}`,
                    `${Config.emojis.default.dot} Private: ${interaction.guild.threads.filter(c => c.type === ChannelTypes.PRIVATE_THREAD).length}`,
                    "",
                    "**Visible Channels**",
                    `${Config.emojis.default.dot} You: ${interaction.guild.channels.filter(c => c.permissionsOf(interaction.user.id).has("VIEW_CHANNEL")).length}/${interaction.guild.channels.size}`,
                    `${Config.emojis.default.dot} Me: ${interaction.guild.channels.filter(c => c.permissionsOf(this.user.id).has("VIEW_CHANNEL")).length}/${interaction.guild.channels.size}`,
                    "",
                    `${Config.emojis.default.dot} Rules Channel: ${interaction.guild.rulesChannelID ? `<#${interaction.guild.rulesChannelID}>` : "**NONE**"}`,
                    `${Config.emojis.default.dot} System Channel: ${interaction.guild.systemChannelID ? `<#${interaction.guild.systemChannelID}>` : "**NONE**"}`,
                    `${Config.emojis.default.dot} Public Updates Channel: ${interaction.guild.publicUpdatesChannelID ? `<#${interaction.guild.publicUpdatesChannelID}>` : "**NONE**"}`
                )
                .setThumbnail(icon ?? "")
                .toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "server").encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent,
        icon: {
            embeds: (
                interaction.guild.icon === null ?
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setDescription("This server does not have an icon.")
                    :
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setImage(icon ?? "")
                        .setDescription(
                            "**Icon**:",
                            `${[512, 1024, 2048, 4096].map(size => `[[${size}]](${interaction.guild.iconURL(undefined, size)!})`).join("  ")}`
                        )
            ).toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "server").encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent,
        splash: {
            embeds: (
                interaction.guild.splash === null ?
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setDescription("This server does not have an invite splash.")
                    :
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setImage(interaction.guild.splashURL()!)
                        .setDescription(
                            "**Invite Splash**:",
                            `${[512, 1024, 2048, 4096].map(size => `[[${size}]](${interaction.guild.splashURL(undefined, size)!})`).join("  ")}`
                        )
            ).toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "server").encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent,
        banner: {
            embeds: (
                interaction.guild.banner === null ?
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setDescription("This server does not have a banner.")
                    :
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setImage(interaction.guild.bannerURL()!)
                        .setDescription(
                            "**Banner**:",
                            `${[512, 1024, 2048, 4096].map(size => `[[${size}]](${interaction.guild.bannerURL(undefined, size)!})`).join("  ")}`
                        )
            ).toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "server").encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent,
        discoverySplash: {
            embeds: (
                interaction.guild.discoverySplash === null ?
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setDescription("This server does not have a discovery splash.")
                    :
                    Util.makeEmbed(true)
                        .setTitle(`Server Info - **${interaction.guild.name}**`)
                        .setImage(interaction.guild.discoverySplashURL()!)
                        .setDescription(
                            "**Banner**:",
                            `${[512, 1024, 2048, 4096].map(size => `[[${size}]](${interaction.guild.discoverySplashURL(undefined, size)!})`).join("  ")}`
                        )
            ).toJSON(true),
            components: new ComponentBuilder<MessageActionRow>()
                .addInteractionButton({
                    customID: State.new(interaction.user.id, "sinfo", "nav").with("section", "server").encode(),
                    emoji:    ComponentBuilder.emojiToPartial(Config.emojis.default.back, "default"),
                    style:    ButtonColors.BLURPLE
                })
                .addInteractionButton({
                    customID: State.exit(interaction.user.id),
                    label:    "Exit",
                    style:    ButtonColors.RED
                })
                .toJSON()
        } as InteractionContent
    };
}

export default new Command(import.meta.url, "sinfo")
    .setDescription("Get some information about this server")
    .addOption(
        new Command.Option(ApplicationCommandOptionTypes.STRING, "section")
            .setDescription("The section of info to get.")
            .addChoice("Server", "server")
            .addChoice("Members", "members")
            .addChoice("Channels", "channels")
            .addChoice("Icon", "icon")
            .addChoice("Splash", "splash")
            .addChoice("Discovery Splash", "discoverySplash")
            .addChoice("Banner", "banner")
    )
    .setValidLocation(ValidLocation.GUILD)
    .setOptionsParser(interaction => ({
        section: interaction.data.options.getString<SectionNames>("section")
    }))
    .setAck("ephemeral-user")
    .setCooldown(3e3)
    .setExecutor(async function(interaction, { section }) {
        const sections = await generateSections.call(this, interaction);
        return interaction.reply(sections[section || "server"]);
    });
