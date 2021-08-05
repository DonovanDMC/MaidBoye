declare namespace MariaDB {
	export interface OkPacket {
		affectedRows: number;
		insertedId: bigint;
		warningStatus: number;
	}

	type CountResponse = [first: Record<"COUNT(*)", bigint>];

	type BooleanData = 0 | 1;
	type BitData = Buffer | [number] | ReturnType<Buffer["toJSON"]>;
}
export = MariaDB;
