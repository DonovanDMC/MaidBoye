declare namespace MariaDB {
	export interface OkPacket {
		affectedRows: number;
		insertedId: bigint;
		warningStatus: number;
	}

	type CountResponse = [first: Record<"COUNT(*)", bigint>];
}
export = MariaDB;
