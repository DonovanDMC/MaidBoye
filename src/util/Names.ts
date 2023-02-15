import Config from "../config/index.js";
import type MaidBoye from "../main.js";
import {
    type GuildFeature,
    type PermissionName,
    GatewayOPCodes,
    InteractionTypes,
    ApplicationCommandTypes,
    MFALevels,
    ChannelTypes,
    VideoQualityModes,
    WebhookTypes,
    VerificationLevels,
    StickerTypes,
    SystemChannelFlags,
    PremiumTypes,
    StageInstancePrivacyLevels,
    GuildScheduledEventEntityTypes,
    GuildScheduledEventPrivacyLevels,
    GuildScheduledEventStatuses,
    PremiumTiers,
    Permissions,
    MessageTypes,
    GuildNSFWLevels,
    InviteTargetTypes,
    MessageFlags,
    ExplicitContentFilterLevels,
    DefaultMessageNotificationLevels,
    UserFlags,
    ThreadMemberFlags,
    ApplicationCommandOptionTypes,
    AutoModerationActionTypes,
    AutoModerationTriggerTypes,
    AutoModerationKeywordPresetTypes,
    AutoModerationEventTypes,
    IntegrationExpireBehaviors,
    StickerFormatTypes,
    SortOrderTypes,
    GuildMemberFlags,
    type Role
} from "oceanic.js";
const { badges, serverFeatures } = Config.emojis;

export const UserFlagNames: Record<UserFlags, string> = {
    // None
    [UserFlags.STAFF]:                 `${badges.staff} Discord Staff`,
    [UserFlags.PARTNER]:               `${badges.partner} Discord Partner`,
    [UserFlags.HYPESQUAD]:             `${badges.hypesquad} Hypesquad`,
    [UserFlags.BUG_HUNTER_LEVEL_1]:    `${badges.bugHunterLevel1} Bug Hunter Level 1`,
    [UserFlags.HYPESQUAD_BRAVERY]:     `${badges.hypesquadBravery} Hypesquad Bravery`,
    [UserFlags.HYPESQUAD_BRILLIANCE]:  `${badges.hypesquadBrilliance} Hypesquad Brilliance`,
    [UserFlags.HYPESQUAD_BALANCE]:     `${badges.hypesquad_balance} Hypesquad Balance`,
    [UserFlags.EARLY_SUPPORTER]:       `${badges.premiumEarlySupporter} Premium Early Supporter`,
    [UserFlags.PSEUDO_TEAM_USER]:      `${badges.teamPsuedoUser} Team Psuedo User`,
    [UserFlags.SYSTEM]:                `${badges.system} System`,
    [UserFlags.BUG_HUNTER_LEVEL_2]:    `${badges.bugHunterLevel2} Bug Hunter Level 2`,
    [UserFlags.VERIFIED_BOT]:          `${badges.verifiedBot} Verified Bot`,
    [UserFlags.VERIFIED_DEVELOPER]:    `${badges.verifiedDeveloper} Verified Bot Developer`,
    [UserFlags.CERTIFIED_MODERATOR]:   `${badges.certifiedModerator} Certified Moderator`,
    [UserFlags.BOT_HTTP_INTERACTIONS]: `${badges.botHTTPInteractions} HTTP Interactions Bot`,
    [UserFlags.SPAMMER]:               `${badges.spammer} Spammer`,
    [UserFlags.ACTIVE_DEVELOPER]:      `${badges.activeDeveloper} Active Developer`
} satisfies Record<UserFlags, string>;

export function getFeatureName(feature: GuildFeature) {
    return `${GuildFeatureNames[feature]}${GuildFeatureDescriptions[feature] ? `[*](${Config.apiURL}/features/${feature})` : ""}`;
}
export const GuildFeatureNames = {
    AUTO_MODERATION:                           "Auto Moderation",
    ANIMATED_BANNER:                           `${serverFeatures.animatedBanner} Animated Banner`,
    ANIMATED_ICON:                             `${serverFeatures.animatedIcon} Animated Icon`,
    APPLICATION_COMMAND_PERMISSIONS_V2:        "Application Command Permissions V2",
    BANNER:                                    `${serverFeatures.banner} Banner`,
    BOT_DEVELOPER_EARLY_ACCESS:                "Bot Developer Early Access",
    COMMUNITY:                                 `${serverFeatures.community} Community`,
    CREATOR_MONETIZABLE:                       "Creator Monetizable",
    CREATOR_MONETIZABLE_DISABLED:              "Creator Monetizable Disabled",
    CREATOR_MONETIZABLE_PROVISIONAL:           "Creator Monetizable Provisional",
    CREATOR_STORE_PAGE:                        "Creator Store Page",
    DEVELOPER_SUPPORT_SERVER:                  "Developer Support Server",
    DISCOVERABLE:                              `${serverFeatures.discoverable} Discoverable`,
    DISCOVERABLE_DISABLED:                     "Discoverable Disabled",
    ENABLED_DISCOVERABLE_BEFORE:               "Enabled Discoverable Before",
    EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT:      "Exposed to Activities WTP Experiment",
    FEATURABLE:                                `${serverFeatures.featurable} Featurable`,
    GUILD_HOME_TEST:                           "Guild Home Test",
    HAD_EARLY_ACTIVITIES_ACCESS:               "Had Early Activities Access",
    HAS_DIRECTORY_ENTRY:                       "Has Directory Entry",
    HUB:                                       "Hub",
    INCREASED_THREAD_LIMIT:                    "Increased Thread Limit",
    INTERNAL_EMPLOYEE_ONLY:                    "Internal Employee Only",
    INVITES_DISABLED:                          "Invites Disabled",
    INVITE_SPLASH:                             `${serverFeatures.inviteSplash} Invite Splash`,
    LINKED_TO_HUB:                             "Linked To Hub",
    MEMBER_PROFILES:                           "Member Profiles",
    MEMBER_VERIFICATION_GATE_ENABLED:          `${serverFeatures.memberVerificationGateEnabled} Member Verification Gate Enabled`,
    MONETIZATION_ENABLED:                      `${serverFeatures.monitizationEnabled} Monitization Enabled`,
    MORE_EMOJI:                                `${serverFeatures.moreEmojis} More Emojis`,
    MORE_EMOJIS:                               `${serverFeatures.moreEmojis} More Emojis`,
    MORE_STICKERS:                             `${serverFeatures.moreStickers} More Stickers`,
    NEWS:                                      `${serverFeatures.news} Announcement Channels (NEWS)`,
    NEW_THREAD_PERMISSIONS:                    `${serverFeatures.newThreadPermissions} New Thread Permissions`,
    PARTNERED:                                 `${serverFeatures.partnered} Partnered`,
    PREVIEW_ENABLED:                           `${serverFeatures.previewEnabled} Preview Enabled`,
    PREVIOUSLY_DISCOVERABLE:                   `${serverFeatures.previouslyDiscoverable} Previously Discoverable`,
    PRIVATE_THREADS:                           `${serverFeatures.privateThreads} Private Threads`,
    RAID_ALERTS_ENABLED:                       "Raid Alerts Enabled",
    ROLE_ICONS:                                `${serverFeatures.roleIcons} Role Icons`,
    ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE: "Role Subscriptions Available For Purchase",
    ROLE_SUBSCRIPTIONS_ENABLED:                `${serverFeatures.roleSubscriptionsEnabled} Role Subscriptions Enabled`,
    SEVEN_DAY_THREAD_ARCHIVE:                  `${serverFeatures.sevenDayThreadArchive} Seven Day Thread Archive`,
    TEXT_IN_VOICE_ENABLED:                     `${serverFeatures.textInVoiceEnabled} Text In Voice Enabled`,
    THREADS_ENABLED:                           `${serverFeatures.threadsEnabled} Threads Enabled`,
    THREADS_ENABLED_TESTING:                   "Threads Enabled Testing",
    THREE_DAY_THREAD_ARCHIVE:                  `${serverFeatures.threeDayThreadArchive} Three Day Thread Archive`,
    TICKETED_EVENTS_ENABLED:                   `${serverFeatures.ticketedEventsEnabled} Ticketed Events Enabled`,
    VANITY_URL:                                `${serverFeatures.vanityURL} Vanity URL`,
    VERIFIED:                                  `${serverFeatures.verified} Verified`,
    VIP_REGIONS:                               `${serverFeatures.vipRegions} 384kbps Voice Bitrate`,
    WELCOME_SCREEN_ENABLED:                    `${serverFeatures.welcomeScreenEnabled} Welcome Screen Enabled`
} satisfies Record<GuildFeature, string>;

// anything with an asterisk uses an unofficial description made by me
export const GuildFeatureDescriptions = {
    AUTO_MODERATION:                           "Guild has set up auto moderation rules",
    ANIMATED_BANNER:                           "Guild has access to set an animated guild banner image",
    ANIMATED_ICON:                             "Guild has access to set an animated guild icon",
    APPLICATION_COMMAND_PERMISSIONS_V2:        "Guild has enabled application command permissions v2. // *",
    BANNER:                                    "Guild has access to set a guild banner image",
    BOT_DEVELOPER_EARLY_ACCESS:                "Bot Developer Early Access",
    COMMUNITY:                                 "Guild can enable welcome screen, Membership Screening, stage channels and discovery, and receives community updates",
    CREATOR_MONETIZABLE:                       null,
    CREATOR_MONETIZABLE_DISABLED:              null,
    CREATOR_MONETIZABLE_PROVISIONAL:           null,
    CREATOR_STORE_PAGE:                        null,
    DEVELOPER_SUPPORT_SERVER:                  null,
    DISCOVERABLE:                              "Guild is able to be discovered in the directory",
    DISCOVERABLE_DISABLED:                     "Guild is not able to be discovered in the directory, and it cannot be enabled", // *
    ENABLED_DISCOVERABLE_BEFORE:               "Guild has previously been discoverable in the directory, but is not currently", // *
    EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT:      null,
    FEATURABLE:                                "Guild is able to be featured in the directory",
    GUILD_HOME_TEST:                           null,
    HAD_EARLY_ACTIVITIES_ACCESS:               null,
    HAS_DIRECTORY_ENTRY:                       null,
    HUB:                                       "Guild is a hub for other servers", // *
    INCREASED_THREAD_LIMIT:                    "Guild has increased thread limits",
    INTERNAL_EMPLOYEE_ONLY:                    null,
    INVITES_DISABLED:                          "Guild has invites temporarily disabled",
    INVITE_SPLASH:                             "Guild has access to set an invite splash background",
    LINKED_TO_HUB:                             "Guild is linked to a hub", // *
    MEMBER_PROFILES:                           null,
    MEMBER_VERIFICATION_GATE_ENABLED:          "Guild has enabled [Membership Screening](https://discord.com/developers/docs/resources/guild#membership-screening-object)",
    MONETIZATION_ENABLED:                      "Guild has enabled monetization",
    MORE_EMOJI:                                "Guild has increased custom emoji slots", // *
    MORE_EMOJIS:                               "Guild has increased custom emoji slots", // *
    MORE_STICKERS:                             "Guild has increased custom sticker slots",
    NEWS:                                      "Guild has access to create news channels",
    NEW_THREAD_PERMISSIONS:                    "Guild has access to new thread permissions", // *
    PARTNERED:                                 "Guild is partnered",
    PREVIEW_ENABLED:                           "Guild can be previewed before joining via Membership Screening or the directory",
    PREVIOUSLY_DISCOVERABLE:                   "Guild has previously been discoverable, but is not currently", // *
    PRIVATE_THREADS:                           "Guild has access to private threads", // *
    RAID_ALERTS_ENABLED:                       "Guild has enabled raid alerts", // *
    ROLE_ICONS:                                "Guild is able to set role icons",
    ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE: "Guild has role subscriptions that can be purchased", // *
    ROLE_SUBSCRIPTIONS_ENABLED:                "Guild has access to role subscriptions", // *
    SEVEN_DAY_THREAD_ARCHIVE:                  "Guild has access to 7 day thread automatic achiving", // *
    TEXT_IN_VOICE_ENABLED:                     "Guild has enabled text in voice", // *
    THREADS_ENABLED:                           "Guild has enabled threads", // *
    THREADS_ENABLED_TESTING:                   "Guild has enabled thread testing", // *
    THREE_DAY_THREAD_ARCHIVE:                  "Guild has access to 3 day thread automatic achiving", // *
    TICKETED_EVENTS_ENABLED:                   "Guild has enabled ticketed events",
    VANITY_URL:                                "Guild has access to set a vanity URL",
    VERIFIED:                                  "Guild is verified",
    VIP_REGIONS:                               "Guild has access to set 384kbps bitrate in voice (previously VIP voice servers)",
    WELCOME_SCREEN_ENABLED:                    "Guild has enabled the welcome screen"
} satisfies Record<GuildFeature, string | null>;

export const DefaultMessageNotificationLevelNames = {
    [DefaultMessageNotificationLevels.ALL_MESSAGES]:  "All Messages",
    [DefaultMessageNotificationLevels.ONLY_MENTIONS]: "Only Mentions",
    [DefaultMessageNotificationLevels.NO_MESSAGES]:   "No Messages",
    [DefaultMessageNotificationLevels.NULL]:          "Default"
} satisfies Record<DefaultMessageNotificationLevels, string>;

export const ExplicitContentFilterLevelNames = {
    [ExplicitContentFilterLevels.DISABLED]:              "Disabled",
    [ExplicitContentFilterLevels.MEMBERS_WITHOUT_ROLES]: "Members Without Roles",
    [ExplicitContentFilterLevels.ALL_MEMBERS]:           "All Members"
} satisfies Record<ExplicitContentFilterLevels, string>;

export const GuildNSFWLevelNames = {
    [GuildNSFWLevels.DEFAULT]:        "Default",
    [GuildNSFWLevels.EXPLICIT]:       "Explicit",
    [GuildNSFWLevels.SAFE]:           "Safe",
    [GuildNSFWLevels.AGE_RESTRICTED]: "Age Restricted"
} satisfies Record<GuildNSFWLevels, string>;

export const InviteTargetTypeNames = {
    [InviteTargetTypes.STREAM]:                      "Stream",
    [InviteTargetTypes.EMBEDDED_APPLICATION]:        "Embedded Application",
    [InviteTargetTypes.ROLE_SUBSCRIPTIONS_PURCHASE]: "Role Subscriptions Purchase"
} satisfies Record<InviteTargetTypes, string>;

export const MessageFlagNames = {
    [MessageFlags.CROSSPOSTED]:                            "Crossposted",
    [MessageFlags.IS_CROSSPOST]:                           "Is Crosspost",
    [MessageFlags.SUPPRESS_EMBEDS]:                        "Suppress Embeds",
    [MessageFlags.SOURCE_MESSAGE_DELETED]:                 "Source Message Deleted",
    [MessageFlags.URGENT]:                                 "Urgent",
    [MessageFlags.HAS_THREAD]:                             "Has Thread",
    [MessageFlags.EPHEMERAL]:                              "Ephemeral",
    [MessageFlags.LOADING]:                                "Loading",
    [MessageFlags.FAILED_TO_MENTION_SOME_ROLES_IN_THREAD]: "Failed to Mention Some Roles in Thread",
    [MessageFlags.SHOULD_SHOW_LINK_NOT_DISCORD_WARNING]:   "Should Show Link Not Discord Warning",
    [MessageFlags.SUPPRESS_NOTIFICATIONS]:                 "Suppress Notifications"
} satisfies Record<MessageFlags, string>;

export const MessageTypeNames = {
    [MessageTypes.DEFAULT]:                                      "Default",
    [MessageTypes.RECIPIENT_ADD]:                                "Recipient Add",
    [MessageTypes.RECIPIENT_REMOVE]:                             "Recipient Remove",
    [MessageTypes.CALL]:                                         "Call",
    [MessageTypes.CHANNEL_NAME_CHANGE]:                          "Channel Name Change",
    [MessageTypes.CHANNEL_ICON_CHANGE]:                          "Channel Icon Change",
    [MessageTypes.CHANNEL_PINNED_MESSAGE]:                       "Channel Pinned Message",
    [MessageTypes.USER_JOIN]:                                    "Guild Member Join",
    [MessageTypes.GUILD_BOOST]:                                  "User Premium Guild Subscription",
    [MessageTypes.GUILD_BOOST_TIER_1]:                           "User Premium Guild Subscription Tier 1",
    [MessageTypes.GUILD_BOOST_TIER_2]:                           "User Premium Guild Subscription Tier 2",
    [MessageTypes.GUILD_BOOST_TIER_3]:                           "User Premium Guild Subscription Tier 3",
    [MessageTypes.CHANNEL_FOLLOW_ADD]:                           "Channel Follow Add",
    [MessageTypes.GUILD_STREAM]:                                 "Guild Stream",
    [MessageTypes.GUILD_DISCOVERY_DISQUALIFIED]:                 "Guild Discovery Disqualified",
    [MessageTypes.GUILD_DISCOVERY_REQUALIFIED]:                  "Guild Discovery Requalified",
    [MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING]: "Guild Discovery Grace Period Initial Warning",
    [MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING]:   "Guild Discovery Grace Period Final Warning",
    [MessageTypes.THREAD_CREATED]:                               "Thread Created",
    [MessageTypes.REPLY]:                                        "Reply",
    [MessageTypes.CHAT_INPUT_COMMAND]:                           "Chat Input Command",
    [MessageTypes.THREAD_STARTER_MESSAGE]:                       "Thread Starter Message",
    [MessageTypes.GUILD_INVITE_REMINDER]:                        "Guild Invite Reminder",
    [MessageTypes.CONTEXT_MENU_COMMAND]:                         "Context Menu Command",
    [MessageTypes.AUTO_MODERATION_ACTION]:                       "Auto Moderation Action",
    [MessageTypes.ROLE_SUBSCRIPTION_PURCHASE]:                   "Role Subscription Purchase",
    [MessageTypes.INTERACTION_PREMIUM_UPSELL]:                   "Interaction Premium Upsell",
    [MessageTypes.STAGE_START]:                                  "Stage Start",
    [MessageTypes.STAGE_END]:                                    "Stage End",
    [MessageTypes.STAGE_SPEAKER]:                                "Stage Speaker",
    [MessageTypes.STAGE_RAISE_HAND]:                             "Stage Raise Hand",
    [MessageTypes.STAGE_TOPIC_CHANGE]:                           "Stage Topic Change",
    [MessageTypes.GUILD_APPLICATION_PREMIUM_SUBSCRIPTION]:       "Guild Application Premium Subscription"
} satisfies Record<MessageTypes, string>;

export const PermissionsByValue = {
    [String(Permissions.CREATE_INSTANT_INVITE)]:               "Create Instant Invite",
    [String(Permissions.KICK_MEMBERS)]:                        "Kick Members",
    [String(Permissions.BAN_MEMBERS)]:                         "Ban Members",
    [String(Permissions.ADMINISTRATOR)]:                       "Administrator",
    [String(Permissions.MANAGE_CHANNELS)]:                     "Manage Channels",
    [String(Permissions.MANAGE_GUILD)]:                        "Manage Server",
    [String(Permissions.ADD_REACTIONS)]:                       "Add Reactions",
    [String(Permissions.VIEW_AUDIT_LOG)]:                      "View Audit Log",
    [String(Permissions.PRIORITY_SPEAKER)]:                    "Priority Speaker",
    [String(Permissions.STREAM)]:                              "Go Live",
    [String(Permissions.VIEW_CHANNEL)]:                        "View Channel",
    [String(Permissions.SEND_MESSAGES)]:                       "Send Messages",
    [String(Permissions.SEND_TTS_MESSAGES)]:                   "Send Text To Speech Messages",
    [String(Permissions.MANAGE_MESSAGES)]:                     "Manage Messages",
    [String(Permissions.EMBED_LINKS)]:                         "Embed Links",
    [String(Permissions.ATTACH_FILES)]:                        "Attach Files",
    [String(Permissions.READ_MESSAGE_HISTORY)]:                "Read Message History",
    [String(Permissions.MENTION_EVERYONE)]:                    "Mention @\u200Beveryone, @\u200Bhere, and All Roles",
    [String(Permissions.USE_EXTERNAL_EMOJIS)]:                 "Use External Emojis",
    [String(Permissions.VIEW_GUILD_INSIGHTS)]:                 "View Server Insights",
    [String(Permissions.CONNECT)]:                             "Connect",
    [String(Permissions.SPEAK)]:                               "Speak",
    [String(Permissions.MUTE_MEMBERS)]:                        "Mute Members",
    [String(Permissions.DEAFEN_MEMBERS)]:                      "Deafen Members",
    [String(Permissions.MOVE_MEMBERS)]:                        "Move Members",
    [String(Permissions.USE_VAD)]:                             "Use Voice Activity Detection",
    [String(Permissions.CHANGE_NICKNAME)]:                     "Change Nickname",
    [String(Permissions.MANAGE_NICKNAMES)]:                    "Manage Nicknames",
    [String(Permissions.MANAGE_ROLES)]:                        "Manage Roles",
    [String(Permissions.MANAGE_WEBHOOKS)]:                     "Manage Webhooks",
    [String(Permissions.MANAGE_EMOJIS_AND_STICKERS)]:          "Manage Emojis and Stickers",
    [String(Permissions.USE_APPLICATION_COMMANDS)]:            "Use Application Commands",
    [String(Permissions.REQUEST_TO_SPEAK)]:                    "Request To Speak",
    [String(Permissions.MANAGE_EVENTS)]:                       "Manage Events",
    [String(Permissions.MANAGE_THREADS)]:                      "Manage Threads",
    [String(Permissions.CREATE_PUBLIC_THREADS)]:               "Create Public Threads",
    [String(Permissions.CREATE_PRIVATE_THREADS)]:              "Create Private Threads",
    [String(Permissions.USE_EXTERNAL_STICKERS)]:               "Use External Stickers",
    [String(Permissions.SEND_MESSAGES_IN_THREADS)]:            "Send Messages In Threads",
    [String(Permissions.USE_EMBEDDED_ACTIVITIES)]:             "Use Embedded Activities",
    [String(Permissions.MODERATE_MEMBERS)]:                    "Moderate Members",
    [String(Permissions.VIEW_CREATOR_MONETIZATION_ANALYTICS)]: "View Creator Monetization Analytics"
};
export const PermissionsByName = Object.entries(Permissions).map(([name, value]) => ({
    [name]: PermissionsByValue[String(value)]
})).reduce((a, b) => ({ ...a, ...b }), {}) as Record<PermissionName, string>;

export const PremiumTierNames = {
    [PremiumTiers.NONE]:   "None",
    [PremiumTiers.TIER_1]: "Tier 1",
    [PremiumTiers.TIER_2]: "Tier 2",
    [PremiumTiers.TIER_3]: "Tier 3"
} satisfies Record<PremiumTiers, string>;

export const GuildScheduledEventStatusNames = {
    [GuildScheduledEventStatuses.SCHEDULED]: "Scheduled",
    [GuildScheduledEventStatuses.ACTIVE]:    "Active",
    [GuildScheduledEventStatuses.COMPLETED]: "Completed",
    [GuildScheduledEventStatuses.CANCELED]:  "Canceled"
} satisfies Record<GuildScheduledEventStatuses, string>;

export const GuildScheduledEventEntityTypeNames = {
    [GuildScheduledEventEntityTypes.STAGE_INSTANCE]: "Stage Instance",
    [GuildScheduledEventEntityTypes.VOICE]:          "Voice",
    [GuildScheduledEventEntityTypes.EXTERNAL]:       "External"
} satisfies Record<GuildScheduledEventEntityTypes, string>;

export const GuildScheduledEventPrivacyLevelNames = {
    [GuildScheduledEventPrivacyLevels.GUILD_ONLY]: "Guild Only"
};

export const PremiumTypeNames = {
    [PremiumTypes.NONE]:          "None",
    [PremiumTypes.NITRO_CLASSIC]: "Nitro Classic",
    [PremiumTypes.NITRO]:         "Nitro",
    [PremiumTypes.NITRO_BASIC]:   "Nitro Basic"
} satisfies Record<PremiumTypes, string>;

export const StageInstancePrivacyLevelNames = {
    [StageInstancePrivacyLevels.PUBLIC]:     "Public",
    [StageInstancePrivacyLevels.GUILD_ONLY]: "Guild Only"
} satisfies Record<StageInstancePrivacyLevels, string>;

export const StickerTypeNames = {
    [StickerTypes.STANDARD]: "Standard",
    [StickerTypes.GUILD]:    "Guild"
} satisfies Record<StickerTypes, string>;

export const SystemChannelFlagNames = {
    [SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATIONS]:                              "Suppress Join Notifications",
    [SystemChannelFlags.SUPPRESS_PREMIUM_SUBSCRIPTIONS]:                           "Suppress Premium Subscriptions",
    [SystemChannelFlags.SUPPRESS_GUILD_REMINDER_NOTIFICATIONS]:                    "Suppress Guild Reminder Notifications",
    [SystemChannelFlags.SUPPRESS_JOIN_NOTIFICATION_REPLIES]:                       "Suppress Join Notification Replies",
    [SystemChannelFlags.SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS]:        "Suppress Role Subscription Purchase Notifications",
    [SystemChannelFlags.SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES]: "Suppress Role Subscription Purchase Notification Replies"
} satisfies Record<SystemChannelFlags, string>;

export const ThreadMemberFlagNames = {
    [ThreadMemberFlags.HAS_INTERACTED]: "Has Interaction",
    [ThreadMemberFlags.ALL_MESSAGES]:   "All Messages",
    [ThreadMemberFlags.ONLY_MENTIONS]:  "Only Mentions",
    [ThreadMemberFlags.NO_MESSAGES]:    "No Messages"
} satisfies Record<ThreadMemberFlags, string>;

export const VerificationLevelNames = {
    [VerificationLevels.NONE]:      "None",
    [VerificationLevels.LOW]:       "Low",
    [VerificationLevels.MEDIUM]:    "Medium",
    [VerificationLevels.HIGH]:      "High",
    [VerificationLevels.VERY_HIGH]: "Very High"
} satisfies Record<VerificationLevels, string>;

export const VideoQualityModeNames = {
    [VideoQualityModes.AUTO]: "Auto",
    [VideoQualityModes.FULL]: "Full 720p"
} satisfies Record<VideoQualityModes, string>;

export const WebhookTypeNames = {
    [WebhookTypes.INCOMING]:         "Incoming",
    [WebhookTypes.CHANNEL_FOLLOWER]: "Channel Follower",
    [WebhookTypes.APPLICATION]:      "Application"
} satisfies Record<WebhookTypes, string>;

export const ChannelTypeNames = {
    [ChannelTypes.GUILD_TEXT]:          "Text",
    [ChannelTypes.DM]:                  "DM",
    [ChannelTypes.GUILD_VOICE]:         "Voice",
    [ChannelTypes.GROUP_DM]:            "Group DM",
    [ChannelTypes.GUILD_CATEGORY]:      "Category",
    [ChannelTypes.GUILD_ANNOUNCEMENT]:  "Announcement",
    [ChannelTypes.ANNOUNCEMENT_THREAD]: "Announcement Thread",
    [ChannelTypes.PUBLIC_THREAD]:       "Public Thread",
    [ChannelTypes.PRIVATE_THREAD]:      "Private Thread",
    [ChannelTypes.GUILD_STAGE_VOICE]:   "Stage Voice",
    [ChannelTypes.GUILD_DIRECTORY]:     "Directory",
    [ChannelTypes.GUILD_FORUM]:         "Forum"
} satisfies Record<ChannelTypes, string>;

export const MFALevelNames = {
    [MFALevels.NONE]:     "None",
    [MFALevels.ELEVATED]: "Required"
} satisfies Record<MFALevels, string>;

export const ApplicationCommandTypeNames = {
    [ApplicationCommandTypes.CHAT_INPUT]: "Chat Input",
    [ApplicationCommandTypes.USER]:       "User",
    [ApplicationCommandTypes.MESSAGE]:    "Message"
} satisfies Record<ApplicationCommandTypes, string>;

export const InteractionTypeNames  = {
    [InteractionTypes.PING]:                             "Ping",
    [InteractionTypes.APPLICATION_COMMAND]:              "Application Command",
    [InteractionTypes.MESSAGE_COMPONENT]:                "Message Component",
    [InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE]: "Application Command Autocomplete",
    [InteractionTypes.MODAL_SUBMIT]:                     "Modal Submit"
} satisfies Record<InteractionTypes, string>;

export const ApplicationCommandOptionTypeNames = {
    [ApplicationCommandOptionTypes.SUB_COMMAND]:       "Sub Command",
    [ApplicationCommandOptionTypes.SUB_COMMAND_GROUP]: "Sub Command Group",
    [ApplicationCommandOptionTypes.STRING]:            "String",
    [ApplicationCommandOptionTypes.INTEGER]:           "Integer",
    [ApplicationCommandOptionTypes.BOOLEAN]:           "Boolean",
    [ApplicationCommandOptionTypes.USER]:              "User",
    [ApplicationCommandOptionTypes.CHANNEL]:           "Channel",
    [ApplicationCommandOptionTypes.ROLE]:              "Role",
    [ApplicationCommandOptionTypes.MENTIONABLE]:       "Mentionable",
    [ApplicationCommandOptionTypes.NUMBER]:            "Number",
    [ApplicationCommandOptionTypes.ATTACHMENT]:        "Attachment"
} satisfies Record<ApplicationCommandOptionTypes, string>;

export const GatewayOPCodeNames = {
    [GatewayOPCodes.DISPATCH]:              "Dispatch",
    [GatewayOPCodes.HEARTBEAT]:             "Heartbeat",
    [GatewayOPCodes.IDENTIFY]:              "Identify",
    [GatewayOPCodes.PRESENCE_UPDATE]:       "Presence Update",
    [GatewayOPCodes.VOICE_STATE_UPDATE]:    "Voice State Update",
    [GatewayOPCodes.RESUME]:                "Resume",
    [GatewayOPCodes.RECONNECT]:             "Reconnect",
    [GatewayOPCodes.REQUEST_GUILD_MEMBERS]: "Request Guild Members",
    [GatewayOPCodes.INVALID_SESSION]:       "Invalid Session",
    [GatewayOPCodes.HELLO]:                 "Hello",
    [GatewayOPCodes.HEARTBEAT_ACK]:         "Heartbeat Acknowledgement"
} satisfies Record<GatewayOPCodes, string>;

export const SortOrderTypeNames = {
    [SortOrderTypes.LATEST_ACTIVITY]: "Latest Activity",
    [SortOrderTypes.CREATION_DATE]:   "Creation Date"
} satisfies Record<SortOrderTypes, string>;

export const AutoModerationActionTypeNames = {
    [AutoModerationActionTypes.BLOCK_MESSAGE]:      "Block Message",
    [AutoModerationActionTypes.SEND_ALERT_MESSAGE]: "Send Alert Message",
    [AutoModerationActionTypes.TIMEOUT]:            "Timeout"
} satisfies Record<AutoModerationActionTypes, string>;

export const AutoModerationTriggerTypeNames = {
    [AutoModerationTriggerTypes.KEYWORD]:        "Keyword",
    [AutoModerationTriggerTypes.SPAM]:           "Spam",
    [AutoModerationTriggerTypes.KEYWORD_PRESET]: "Keyword Preset",
    [AutoModerationTriggerTypes.MENTION_SPAM]:   "Mention Spam"
} satisfies Record<AutoModerationTriggerTypes, string>;

export const AutoModerationKeywordPresetTypeNames = {
    [AutoModerationKeywordPresetTypes.PROFANITY]:      "Profanity",
    [AutoModerationKeywordPresetTypes.SEXUAL_CONTENT]: "Sexual Content",
    [AutoModerationKeywordPresetTypes.SLURS]:          "Slurs"
};

export const AutoModerationEventTypeNames = {
    [AutoModerationEventTypes.MESSAGE_SEND]: "Message Send"
} satisfies Record<AutoModerationEventTypes, string>;

export const IntegrationExpireBehaviorNames = {
    [IntegrationExpireBehaviors.REMOVE_ROLE]: "Remove Role",
    [IntegrationExpireBehaviors.KICK]:        "Kick"
} satisfies Record<IntegrationExpireBehaviors, string>;

export const StickerFormatTypeNames = {
    [StickerFormatTypes.PNG]:    "PNG",
    [StickerFormatTypes.APNG]:   "APNG",
    [StickerFormatTypes.LOTTIE]: "Lottie",
    [StickerFormatTypes.GIF]:    "GIF"
} satisfies Record<StickerFormatTypes, string>;

export const GuildMemberFlagNames = {
    [GuildMemberFlags.DID_REJOIN]:            "Rejoined",
    [GuildMemberFlags.COMPLETED_ONBOARDING]:  "Completed Onboarding",
    [GuildMemberFlags.BYPASSES_VERIFICATION]: "Bypasses Verification",
    [GuildMemberFlags.STARTED_ONBOARDING]:    "Started Onboarding"
} satisfies Record<GuildMemberFlags, string>;

export async function getRoleManagedType(role: Role) {
    let managedType: string | undefined;
    if (role.tags.botID !== undefined) {
        const user = await (role.client as MaidBoye).getUser(role.tags.botID);
        managedType = `Bot Permissions (${user?.tag ?? role.tags.botID})`;
    } else if (role.tags.integrationID !== undefined) {
        managedType = `Integration (${role.guild.integrations.get(role.tags.integrationID)?.name ?? role.tags.integrationID})`;
    } else if (role.tags.premiumSubscriber !== false) {
        managedType = "Nitro Booster";
    } else if (role.tags.guildConnections !== false) {
        managedType = "Linked Role";
    } else if (role.tags.subscriptionListingID !== undefined) {
        managedType = `Subscription Role (Purchasable: ${role.tags.availableForPurchase ? "Yes" : "No"})`;
    }

    return managedType;
}
