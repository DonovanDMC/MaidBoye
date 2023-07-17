import type{ default as ModLogEntry, ModLogType } from "../../db/Models/ModLog.js";
import type GuildConfig from "../../db/Models/GuildConfig.js";
import type Strike from "../../db/Models/Strike.js";
import type Timed from "../../db/Models/Timed.js";
import type {
    Member,
    Guild,
    User,
    AnyTextableGuildChannel,
    Message
} from "oceanic.js";

declare namespace ModLog {
    interface BaseOptions {
        blame: Member | null;
        gConfig: GuildConfig;
        guild: Guild;
        hideReason?: boolean;
        reason: string;
        type: ModLogType;
    }

    export interface BanOptions extends BaseOptions {
        deleteSeconds: number;
        target: User | Member;
        time: number;
        type: ModLogType.BAN;
    }

    export interface UnbanOptions extends BaseOptions {
        target: User;
        type: ModLogType.UNBAN;
    }

    export interface SoftbanOptions extends BaseOptions {
        deleteSeconds: number;
        target: Member;
        type: ModLogType.SOFTBAN;
    }

    export interface MuteOptions extends BaseOptions {
        target: Member;
        time: number;
        type: ModLogType.MUTE;
    }

    export interface UnmuteOptions extends BaseOptions {
        target: Member;
        type: ModLogType.UNMUTE;
    }

    export interface KickOptions extends BaseOptions {
        target: Member;
        type: ModLogType.KICK;
    }

    export interface LockOptions extends BaseOptions {
        target: AnyTextableGuildChannel;
        type: ModLogType.LOCK;
    }

    export interface UnlockOptions extends BaseOptions {
        target: AnyTextableGuildChannel;
        type: ModLogType.UNLOCK;
    }

    export interface LockdownOptions extends BaseOptions {
        type: ModLogType.LOCKDOWN;
    }

    export interface UnlockdownOptions extends BaseOptions {
        type: ModLogType.UNLOCKDOWN;
    }

    export interface WarningOptions extends BaseOptions {
        target: Member;
        type: ModLogType.WARNING;
        /** internal id */
        warningID: string;
    }

    export interface DeleteWarningOptions extends BaseOptions {
        target: Member;
        type: ModLogType.DELETE_WARNING;
        /** sequential id */
        warningID: number;
    }

    export interface ClearWarningsOptions extends BaseOptions {
        amount: number;
        target: Member;
        type: ModLogType.CLEAR_WARNINGS;
    }

    export interface StrikeOptions extends BaseOptions {
        amount: number;
        target: Member;
        type: ModLogType.STRIKE;
    }

    export type AnyOptions = BanOptions | UnbanOptions | SoftbanOptions | MuteOptions | UnmuteOptions | KickOptions | LockOptions | UnlockOptions | LockdownOptions | UnlockdownOptions | WarningOptions | DeleteWarningOptions | ClearWarningsOptions | StrikeOptions;

    export interface CreateEntryResultStrikeTimed {
        active: boolean;
        caseID: number;
        entry: ModLogEntry;
        message: Message<AnyTextableGuildChannel>;
        strike: Strike;
        timed: Timed | null;
    }
    export interface CreateEntryResultStrike {
        active: boolean;
        caseID: number;
        entry: ModLogEntry;
        message: Message<AnyTextableGuildChannel>;
        strike: Strike;
        timed: null;
    }
    export interface CreateEntryResultNeither {
        active: boolean;
        caseID: number;
        entry: ModLogEntry;
        message: Message<AnyTextableGuildChannel>;
        strike: null;
        timed: null;
    }
}

export = ModLog;
