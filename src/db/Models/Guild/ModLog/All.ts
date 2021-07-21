import BanEntry, { RawBanEntry } from "./BanEntry";
import ClearWarningsEntry, { RawClearWarningsEntry } from "./ClearWarningsEntry";
import DeleteWarningEntry, { RawDeleteWarningEntry } from "./DeleteWarningEntry";
import KickEntry, { RawKickEntry } from "./KickEntry";
import LockDownEntry, { RawLockDownEntry } from "./LockDownEntry";
import LockEntry, { RawLockEntry } from "./LockEntry";
import MuteEntry, { RawMuteEntry } from "./MuteEntry";
import SoftBanEntry, { RawSoftBanEntry } from "./SoftBanEntry";
import UnBanEntry, { RawUnBanEntry } from "./UnBanEntry";
import UnLockDownEntry, { RawUnLockDownEntry } from "./UnLockDownEntry";
import UnLockEntry, { RawUnLockEntry } from "./UnLockEntry";
import UnMuteEntry, { RawUnMuteEntry } from "./UnMuteEntry";
import WarnEntry, { RawWarnEntry } from "./WarnEntry";

export type AnyEntry = BanEntry | ClearWarningsEntry | DeleteWarningEntry |
KickEntry | LockDownEntry | LockEntry |
MuteEntry | SoftBanEntry | UnBanEntry |
UnLockDownEntry | UnLockEntry | UnMuteEntry |
WarnEntry;
export type AnyRawEntry = RawBanEntry | RawClearWarningsEntry | RawDeleteWarningEntry |
RawKickEntry | RawLockDownEntry | RawLockEntry |
RawMuteEntry | RawSoftBanEntry | RawUnBanEntry |
RawUnLockDownEntry | RawUnLockEntry | RawUnMuteEntry |
RawWarnEntry;
export {
	BanEntry, RawBanEntry,
	ClearWarningsEntry, RawClearWarningsEntry,
	DeleteWarningEntry, RawDeleteWarningEntry,
	KickEntry, RawKickEntry,
	LockDownEntry, RawLockDownEntry,
	LockEntry, RawLockEntry,
	MuteEntry, RawMuteEntry,
	SoftBanEntry, RawSoftBanEntry,
	UnBanEntry, RawUnBanEntry,
	UnLockDownEntry, RawUnLockDownEntry,
	UnLockEntry, RawUnLockEntry,
	UnMuteEntry, RawUnMuteEntry,
	WarnEntry, RawWarnEntry
};
