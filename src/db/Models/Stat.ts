import db from "../index.js";
import StatsHandler from "../../util/StatsHandler.js";
import { assert } from "tsafe";
import type { ApplicationCommandTypes, InteractionTypes } from "oceanic.js";


export interface StatData {
    application_command_type: ApplicationCommandTypes | null;
    application_command_type_name: string | null;
    close_code: number | null;
    created_at: Date;
    event: string | null;
    id: string;
    interaction_type: InteractionTypes | null;
    interaction_type_name: string | null;
    payload: number | null;
    restriction: string | null;
    sauce_attempted: Array<string> | null;
    sauce_method: string | null;
    sauce_simularity: number | null;
    session_id: string;
    shard_id: number | null;
    status_code: number | null;
    status_message: string | null;
    tags: Array<string>;
    type: StatType;
    updated_at: Date | null;
}
export type StatCreationRequired = Pick<StatData, "type">;
export type StatCreationIgnored = "id" | "created_at" | "updated_at" | "session_id";
export type StatUpdateIgnored = "id" | "created_at" | "updated_at" | "session_id";
export type StatCreationData = StatCreationRequired & Partial<Omit<StatData, keyof StatCreationRequired | StatCreationIgnored>>;
export type StatUpdateData = Partial<Omit<StatData, StatUpdateIgnored>>;
export enum StatType {
    UNKNOWN            = 0,
    GATEWAY_RECIEVE    = 1,
    GATEWAY_SEND       = 2,
    REST               = 3,
    FAILED_RESTRICTION = 4,
    INTERACTION        = 5,
    READY              = 6,
    SHARD_READY        = 7,
    SHARD_DISCONNECT   = 8,
    SHARD_RESUME       = 9,
    SAUCE_SUCCESS      = 10,
    SAUCE_FAIL         = 11,
    SAUCE_RATELIMITED  = 12
}
export interface StatProperties {
    FAILED_RESTRICTION: [restriction: string];
    GATEWAY_RECIEVE: [payload: number, event: string | null];
    GATEWAY_SEND: [];
    INTERACTION: [type: InteractionTypes, applicationCommandType: ApplicationCommandTypes | null];
    READY: [];
    REST: [statusCode: number, statusMessage: string];
    SAUCE_FAIL: [simularity: number, attempted: Array<string>];
    SAUCE_RATELIMITED: [simularity: number, attempted: Array<string>];
    SAUCE_SUCCESS: [simularity: number, method: string];
    SHARD_DISCONNECT: [id: number, code: number | null];
    SHARD_READY: [id: number];
    SHARD_RESUME: [id: number];
    UNKNOWN: [];
}

export default class Stat {
    static TABLE = "stats";
    _data: StatData;
    applicationCommandType: ApplicationCommandTypes | null;
    applicationCommandTypeName: string | null;
    closeCode: number | null;
    createdAt: Date;
    event: string | null;
    id: string;
    interactionType: InteractionTypes | null;
    interactionTypeName: string | null;
    payload: number | null;
    restriction: string | null;
    sauceAttempted: Array<string> | null;
    sauceMethod: string | null;
    sauceSimilarity: number | null;
    sessionID: string;
    shardID: number | null;
    statusCode: number | null;
    statusMessage: string | null;
    tags: Array<string>;
    type: StatType;
    updatedAt: Date | null;
    constructor(data: StatData) {
        assert(data && data.id, "invalid id found in Stat");
        this.id = data.id;
        this.load(data);
    }

    static async create(data: StatCreationData) {
        data = ({ ...data, session_id: StatsHandler.SessionID }) as typeof data & { session_id: string; };
        const res = await db.insert<string>(this.TABLE, data);
        const createdObject = await this.get(res);
        assert(createdObject !== null, "failed to create new Stat object");
        return createdObject;
    }

    static async delete(id: string) {
        return db.delete(this.TABLE, id);
    }

    static async get(id: string) {
        const { rows: [res] } = await db.query<StatData>(`SELECT * FROM ${this.TABLE} WHERE id = $1`, [id]);
        return res ? new Stat(res) : null;
    }

    private load(data: StatData) {
        this._data                        = data;
        this.applicationCommandType     = data.application_command_type;
        this.applicationCommandTypeName = data.application_command_type_name;
        this.closeCode                  = data.close_code;
        this.createdAt                  = data.created_at;
        this.event                      = data.event;
        this.interactionType            = data.interaction_type;
        this.interactionTypeName        = data.interaction_type_name;
        this.payload                    = data.payload;
        this.restriction                = data.restriction;
        this.sauceAttempted             = data.sauce_attempted;
        this.sauceMethod                = data.sauce_method;
        this.sauceSimilarity            = data.sauce_simularity;
        this.sessionID                  = data.session_id;
        this.shardID                    = data.shard_id;
        this.statusCode                 = data.status_code;
        this.statusMessage              = data.status_message;
        this.tags                       = data.tags;
        this.type                       = data.type;
        this.updatedAt                  = data.updated_at;
    }
}
