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
		type: "ban" | "unban";
	}

	interface BanEntry extends GenericEntry {
		type: "ban";
		deleteDays: number;
		timedId: string | null;
	}

	interface UnBanEntry extends GenericEntry {
		type: "unban";
	}
}
export = ModLog;
