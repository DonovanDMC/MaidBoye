import ClientEvent from "../util/ClientEvent.js";
import LogEvent, { LogEvents } from "../db/Models/LogEvent.js";
import Util from "../util/Util.js";
import { Colors } from "../util/Constants.js";
import {
    DefaultMessageNotificationLevelNames,
    ExplicitContentFilterLevelNames,
    getFeatureName,
    GuildNSFWLevelNames,
    MFALevelNames,
    SystemChannelFlagNames,
    VerificationLevelNames
} from "../util/Names.js";
import {
    AuditLogActionTypes,
    EmbedOptions,
    GuildFeature,
    SystemChannelFlags,
    WelcomeScreenChannel
} from "oceanic.js";
import { Time } from "@uwu-codes/utils";

export default new ClientEvent("guildUpdate", async function guildUpdateEvent(guild, oldGuild) {
    if (oldGuild === null) return;
    const events = await LogEvent.getType(guild.id, LogEvents.GUILD_UPDATE);
    for (const log of events) {
        const embeds: Array<EmbedOptions> = [];

        if (guild.afkChannelID !== oldGuild.afkChannelID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's AFK channel was changed.")
                .addField("Old Channel", oldGuild.afkChannelID ? `<#${oldGuild.afkChannelID}>` : "None", false)
                .addField("New Channel", guild.afkChannelID ? `<#${guild.afkChannelID}>` : "None", false)
                .toJSON()
            );
        }

        if (guild.afkTimeout !== oldGuild.afkTimeout) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's AFK timeout was changed.")
                .addField("Old Timeout", oldGuild.afkTimeout === 0 ? "None" : Time.ms(oldGuild.afkTimeout * 1000, { words: true }), false)
                .addField("New Timeout", guild.afkTimeout === 0 ? "None" : Time.ms(guild.afkTimeout * 1000, { words: true }), false)
                .toJSON()
            );
        }

        if (guild.banner !== oldGuild.banner) {
            const embed = Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's banner was changed.",
                    "",
                    guild.banner === null ? "[Banner Removed]" : `[New Banner](${guild.bannerURL()!})`
                ]);
            if (guild.banner !== null) embed.setImage(guild.bannerURL()!);
            embeds.push(embed.toJSON());
        }

        if (guild.defaultMessageNotifications !== oldGuild.defaultMessageNotifications) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's default message notifications were changed.")
                .addField("Old Notifications", DefaultMessageNotificationLevelNames[oldGuild.defaultMessageNotifications], false)
                .addField("New Notifications", DefaultMessageNotificationLevelNames[guild.defaultMessageNotifications], false)
                .toJSON()
            );
        }

        if (guild.description !== oldGuild.description) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's description was changed.")
                .addField("Old Description", (oldGuild.description ?? "None") || "[Empty]", false)
                .addField("New Description", (guild.description ?? "None") || "[Empty]", false)
                .toJSON()
            );
        }

        if (guild.discoverySplash !== oldGuild.discoverySplash) {
            const embed = Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's discovery splash was changed.",
                    "",
                    guild.discoverySplash === null ? "[Discovery Splash Removed]" : `[New Discovery Splash](${guild.discoverySplashURL()!})`
                ]);
            if (guild.discoverySplash !== null) embed.setImage(guild.discoverySplashURL()!);
            embeds.push(embed.toJSON());
        }

        if (guild.explicitContentFilter !== oldGuild.explicitContentFilter) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's explicit content filter was changed.")
                .addField("Old Filter", ExplicitContentFilterLevelNames[oldGuild.explicitContentFilter], false)
                .addField("New Filter", ExplicitContentFilterLevelNames[guild.explicitContentFilter], false)
                .toJSON()
            );
        }


        const addedFeatures = [] as Array<GuildFeature>;
        const removedFeatures = [] as Array<GuildFeature>;
        oldGuild.features.forEach(f => {
            if (!guild.features.includes(f)) removedFeatures.push(f);
        });
        guild.features.forEach(f => {
            if (!oldGuild.features.includes(f)) addedFeatures.push(f);
        });
        if (addedFeatures.length > 0 || removedFeatures.length > 0) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's features were changed.",
                    "",
                    "**Changes**:",
                    "```diff",
                    ...addedFeatures.map(f => `+ ${getFeatureName(f)}`),
                    ...removedFeatures.map(f => `- ${getFeatureName(f)}`),
                    "```"
                ])
                .toJSON()
            );
        }

        if (guild.icon !== oldGuild.icon) {
            const embed = Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's icon was changed.",
                    "",
                    guild.icon === null ? "[Icon Removed]" : `[New Icon](${guild.iconURL()!})`
                ]);
            if (guild.icon !== null) embed.setImage(guild.iconURL()!);
            embeds.push(embed.toJSON());
        }

        if (guild.maxMembers !== oldGuild.maxMembers) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's maximum members was changed.")
                .addField("Old Maximum", oldGuild.maxMembers === undefined ? "Unknown" : oldGuild.maxMembers.toString(), false)
                .addField("New Maximum", guild.maxMembers === undefined ? "Unknown" : guild.maxMembers.toString(), false)
                .toJSON()
            );
        }

        if (guild.maxPresences !== oldGuild.maxPresences) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's maximum presences was changed.")
                .addField("Old Maximum", oldGuild.maxPresences === undefined ? "Unknown" : oldGuild.maxPresences.toString(), false)
                .addField("New Maximum", guild.maxPresences === undefined ? "Unknown" : guild.maxPresences.toString(), false)
                .toJSON()
            );
        }

        if (guild.maxStageVideoChannelUsers !== oldGuild.maxStageVideoChannelUsers) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's maximum stage video channel users was changed.")
                .addField("Old Maximum", oldGuild.maxStageVideoChannelUsers === undefined ? "Unknown" : oldGuild.maxStageVideoChannelUsers.toString(), false)
                .addField("New Maximum", guild.maxStageVideoChannelUsers === undefined ? "Unknown" : guild.maxStageVideoChannelUsers.toString(), false)
                .toJSON()
            );
        }

        if (guild.maxVideoChannelUsers !== oldGuild.maxVideoChannelUsers) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's maximum video channel users was changed.")
                .addField("Old Maximum", oldGuild.maxVideoChannelUsers === undefined ? "Unknown" : oldGuild.maxVideoChannelUsers.toString(), false)
                .addField("New Maximum", guild.maxVideoChannelUsers === undefined ? "Unknown" : guild.maxVideoChannelUsers.toString(), false)
                .toJSON()
            );
        }

        if (guild.mfaLevel !== oldGuild.mfaLevel) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's MFA level was changed.")
                .addField("Old Level", MFALevelNames[oldGuild.mfaLevel], false)
                .addField("New Level", MFALevelNames[guild.mfaLevel], false)
                .toJSON()
            );
        }

        if (guild.name !== oldGuild.name) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's name was changed.")
                .addField("Old Name", oldGuild.name, false)
                .addField("New Name", guild.name, false)
                .toJSON()
            );
        }

        if (guild.nsfwLevel !== oldGuild.nsfwLevel) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's NSFW level was changed.")
                .addField("Old Level", GuildNSFWLevelNames[oldGuild.nsfwLevel], false)
                .addField("New Level", GuildNSFWLevelNames[guild.nsfwLevel], false)
                .toJSON()
            );
        }

        if (guild.ownerID !== oldGuild.ownerID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's owner was changed.")
                .addField("Old Owner", `<@!${oldGuild.ownerID}>`, false)
                .addField("New Owner", `<@!${guild.ownerID}>`, false)
                .toJSON()
            );
        }

        if (guild.preferredLocale !== oldGuild.preferredLocale) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's preferred locale was changed.")
                .addField("Old Locale", oldGuild.preferredLocale, false)
                .addField("New Locale", guild.preferredLocale, false)
                .toJSON()
            );
        }

        if (guild.premiumProgressBarEnabled !== oldGuild.premiumProgressBarEnabled) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription(`This server's premium progress bar was ${guild.premiumProgressBarEnabled ? "enabled" : "disabled"}.`)
                .toJSON()
            );
        }

        if (guild.publicUpdatesChannelID !== oldGuild.publicUpdatesChannelID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's public updates channel was changed.")
                .addField("Old Channel", oldGuild.publicUpdatesChannelID === null ? "None" : `<#${oldGuild.publicUpdatesChannelID}>`, false)
                .addField("New Channel", guild.publicUpdatesChannelID === null ? "None" : `<#${guild.publicUpdatesChannelID}>`, false)
                .toJSON()
            );
        }

        if (guild.region !== oldGuild.region) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's region was changed.")
                .addField("Old Region", oldGuild.region === null ? "Default" : oldGuild.region === undefined ? "Unknown" : oldGuild.region, false)
                .addField("New Region", guild.region === null ? "Default" : guild.region === undefined ? "Unknown" : guild.region, false)
                .toJSON()
            );
        }

        if (guild.rulesChannelID !== oldGuild.rulesChannelID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's rules channel was changed.")
                .addField("Old Channel", oldGuild.rulesChannelID === null ? "None" : `<#${oldGuild.rulesChannelID}>`, false)
                .addField("New Channel", guild.rulesChannelID === null ? "None" : `<#${guild.rulesChannelID}>`, false)
                .toJSON()
            );
        }

        if (guild.splash !== oldGuild.splash) {
            const embed = Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's splash was changed.",
                    "",
                    guild.splash === null ? "[Splash Removed]" : `[Splash Banner](${guild.splashURL()!})`
                ]);
            if (guild.splash !== null) embed.setImage(guild.splashURL()!);
            embeds.push(embed.toJSON());
        }

        const oldSystemChannelFlags = Util.getFlagsArray(SystemChannelFlags, oldGuild.systemChannelFlags);
        const newSystemChannelFlags = Util.getFlagsArray(SystemChannelFlags, guild.systemChannelFlags);


        const addedSystemChannelFlags = [] as Array<keyof typeof SystemChannelFlags>;
        const removedSystemChannelFlags = [] as Array<keyof typeof SystemChannelFlags>;
        oldSystemChannelFlags.forEach(f => {
            if (!newSystemChannelFlags.includes(f)) removedSystemChannelFlags.push(f);
        });
        newSystemChannelFlags.forEach(f => {
            if (!oldSystemChannelFlags.includes(f)) addedSystemChannelFlags.push(f);
        });
        if (addedSystemChannelFlags.length > 0 || removedSystemChannelFlags.length > 0) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription([
                    "This server's system channel flags were changed.",
                    "",
                    "**Changes**:",
                    "```diff",
                    ...addedSystemChannelFlags.map(f => `+ ${SystemChannelFlagNames[SystemChannelFlags[f]]}`),
                    ...removedSystemChannelFlags.map(f => `- ${SystemChannelFlagNames[SystemChannelFlags[f]]}`),
                    "```"
                ])
                .toJSON()
            );
        }

        if (guild.systemChannelID !== oldGuild.systemChannelID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's system channel was changed.")
                .addField("Old Channel", oldGuild.systemChannelID === null ? "None" : `<#${oldGuild.systemChannelID}>`, false)
                .addField("New Channel", guild.systemChannelID === null ? "None" : `<#${guild.systemChannelID}>`, false)
                .toJSON()
            );
        }

        if (guild.vanityURLCode !== oldGuild.vanityURLCode) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's vanity URL code was changed.")
                .addField("Old Code", oldGuild.vanityURLCode === null ? "None" : oldGuild.vanityURLCode, false)
                .addField("New Code", guild.vanityURLCode === null ? "None" : guild.vanityURLCode, false)
                .toJSON()
            );
        }

        if (guild.verificationLevel !== oldGuild.verificationLevel) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's verification level was changed.")
                .addField("Old Level", VerificationLevelNames[oldGuild.verificationLevel], false)
                .addField("New Level", VerificationLevelNames[guild.verificationLevel], false)
                .toJSON()
            );
        }

        if ((guild.welcomeScreen || oldGuild.welcomeScreen) && JSON.stringify(guild.welcomeScreen ?? {}) !== JSON.stringify(oldGuild.welcomeScreen ?? {})) {
            if (guild.welcomeScreen === undefined || oldGuild.welcomeScreen === undefined) {
                embeds.push(Util.makeEmbed(true)
                    .setTitle("Server Updated")
                    .setColor(Colors.gold)
                    .setDescription(`This server's welcome screen was ${guild.welcomeScreen === undefined ? "disabled" : "enabled"}.`)
                    .toJSON()
                );
            } else {
                if (guild.welcomeScreen.description !== oldGuild.welcomeScreen.description) {
                    embeds.push(Util.makeEmbed(true)
                        .setTitle("Server Updated")
                        .setColor(Colors.gold)
                        .setDescription("This server's welcome screen description was changed.")
                        .addField("Old Description", oldGuild.welcomeScreen.description === null ? "None" : oldGuild.welcomeScreen.description, false)
                        .addField("New Description", guild.welcomeScreen.description === null ? "None" : guild.welcomeScreen.description, false)
                        .toJSON()
                    );
                }
                const addedChannels = [] as Array<WelcomeScreenChannel>;
                const removedchannels = [] as Array<WelcomeScreenChannel>;
                oldGuild.welcomeScreen.welcomeChannels.forEach(ch => {
                    if (!guild.welcomeScreen!.welcomeChannels.includes(ch)) removedchannels.push(ch);
                });
                guild.welcomeScreen.welcomeChannels.forEach(ch => {
                    if (!oldGuild.welcomeScreen!.welcomeChannels.includes(ch)) addedChannels.push(ch);
                });
                if (addedChannels.length > 0 || removedchannels.length > 0) {
                    embeds.push(Util.makeEmbed(true)
                        .setTitle("Server Updated")
                        .setColor(Colors.gold)
                        .setDescription([
                            "This server's welcome screen channels were changed.",
                            "",
                            "**Changes**:",
                            "```diff",
                            ...addedChannels.map(f => `+ #${guild.channels.get(f.channelID)?.name ?? f.channelID} - ${f.description}`),
                            ...removedchannels.map(f => `- #${guild.channels.get(f.channelID)?.name ?? f.channelID} - ${f.description}`),
                            "```"
                        ])
                        .toJSON()
                    );
                }
            }
        }

        if (guild.widgetChannelID !== oldGuild.widgetChannelID) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription("This server's widget channel was changed.")
                .addField("Old Channel", oldGuild.widgetChannelID === null ? "None" : `<#${oldGuild.widgetChannelID}>`, false)
                .addField("New Channel", guild.widgetChannelID === null ? "None" : `<#${guild.widgetChannelID}>`, false)
                .toJSON()
            );
        }

        if (guild.widgetEnabled !== oldGuild.widgetEnabled) {
            embeds.push(Util.makeEmbed(true)
                .setTitle("Server Updated")
                .setColor(Colors.gold)
                .setDescription(`This server's widget was ${guild.widgetEnabled ? "enabled" : "disabled"}.`)
                .toJSON()
            );
        }

        if (embeds.length === 0) continue;

        if (guild.clientMember.permissions.has("VIEW_AUDIT_LOG")) {
            const auditLog = await guild.getAuditLog({
                actionType: AuditLogActionTypes.GUILD_UPDATE,
                limit:      50
            });
            const entry = auditLog.entries.find(e => e.targetID === guild.id);
            if (entry?.user && (entry.createdAt.getTime() + 5e3) > Date.now()) {
                const embed = Util.makeEmbed(true)
                    .setTitle("Server Update: Blame")
                    .setColor(Colors.gold)
                    .setDescription(`**${entry.user.tag}** (${entry.user.mention})`);
                if (entry.reason) embed.addField("Reason", entry.reason, false);
                embeds.push(embed.toJSON());
            }
        }

        await log.execute(this, { embeds });
    }
});
