declare namespace ModLog {
	interface GenericEntry {
		/** internal use only */
		id: string;
		entryId: number;
		guildId: string;
		messageId: string | null;
		target: string;
		/** id or "automatic" */
		blame: string;
		reason: string | null;
		type:
		"ban" | "kick" | "lock" |
		"lockdown" | "mute" | "softban" |
		"unban" | "unlock" | "unlockdown" |
		"unmute" | "warn" | "delwarning" |
		"clearwarnings";
		createdAt: number;
		lastEditedAt: number | null;
		lastEditedBy: string | null;
	}

	type AnyEntry = BanEntry | KickEntry | LockEntry |
		LockDownEntry | MuteEntry | SoftBanEntry |
		UnBanEntry | UnLockEntry | UnLockDownEntry |
		UnMuteEntry | WarnEntry | DeleteWarningEntry |
		ClearWarningsEntry;

	interface BanEntry extends GenericEntry {
		type: "ban";
		deleteDays: number;
		timedId: string | null;
	}

	interface KickEntry extends GenericEntry {
		type: "kick";
	}

	interface LockEntry extends GenericEntry {
		type: "lock";
	}

	interface LockDownEntry extends GenericEntry {
		target: null;
		type: "lockdown";
	}

	interface MuteEntry extends GenericEntry {
		type: "mute";
		timedId: string | null;
	}/* 

	interface CleanEntry extends GenericEntry {
		type: "clean";
		type: "all" | "user" | "bots" | "channel" | "role" | "commands" | "text";
		amount: number;
	} */

	interface SoftBanEntry extends GenericEntry {
		type: "softban";
	}

	interface UnBanEntry extends GenericEntry {
		type: "unban";
	}

	interface UnlockEntry extends GenericEntry {
		type: "unlock";
	}

	interface UnLockDownEntry extends GenericEntry {
		target: null;
		type: "unlockdown";
	}

	interface UnMuteEntry extends GenericEntry {
		type: "unmute";
	}

	interface WarnEntry extends GenericEntry {
		type: "warn";
		active: boolean;
	}

	interface DeleteWarningEntry extends GenericEntry {
		type: "delwarning";
		warningId: string;
	}

	interface ClearWarningsEntry extends GenericEntry {
		type: "clearwarnings";
		total: number;
	}
}
export = ModLog;
