import Config from "../config/index.js";
import Logger from "../util/Logger.js";
import Debug from "../util/Debug.js";
import StatsHandler from "../util/StatsHandler.js";
import type { QueryConfig, QueryResultRow } from "pg";
import pg from "pg";
import Redis from "ioredis";
import { Timer } from "@uwu-codes/utils";

export interface OkPacket<T extends bigint | number = bigint> {
    affectedRows: number;
    insertId: T;
    warningStatus: number;
}

export interface CountResult { count: string; }


export default class db {
    static dbClient: pg.Client;
    static init = false;
    static ready = false;
    static redis: Redis;
    static async delete(table: string, id: number | string) {
        await this.initIfNotReady();
        const res = await this.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        return res.rowCount >= 1;
    }

    // because of some weird circular import nonsense this has to be done this way
    static async initIfNotReady() {
        if (this.init) {
            return;
        }
        this.init = true;

        this.dbClient = new pg.Client({
            host:             Config.dbHost,
            port:             Config.dbPort,
            user:             Config.dbUser,
            password:         Config.dbPassword,
            database:         Config.dbDatabase,
            ssl:              Config.dbSSL,
            application_name: "Maid Boye"
        });
        Logger.getLogger("Postgres").debug("Connecting...");
        const dbStart = Timer.getTime();
        await this.dbClient.connect();
        const dbEnd = Timer.getTime();
        Logger.getLogger("Postgres").debug(`Connected in ${Timer.calc(dbStart, dbEnd, 3, false)}.`);
        Logger.getLogger("Redis").debug("Connecting...");
        const rStart = Timer.getTime();
        // we're using KeyDB, but it's compatible with redis clients
        this.redis = new Redis(Config.redisPort, Config.redisHost, {
            username:         Config.redisUser,
            password:         Config.redisPassword,
            db:               Config.redisDb,
            connectionName:   "Maid Boye",
            enableReadyCheck: true
        });
        this.redis.on("ready", () => {
            const rEnd = Timer.getTime();
            Logger.getLogger("Redis").debug(`Connected in ${Timer.calc(rStart, rEnd, 3, false)}.`);
        });
        this.ready = true;

        await StatsHandler.processPending();
    }

    static async insert<T extends number | string = number | string>(table: string, data: Record<string, unknown>, ignoreDuplicate: true): Promise<T | null>;
    static async insert<T extends number | string = number | string>(table: string, data: Record<string, unknown>, ignoreDuplicate?: false): Promise<T>;
    static async insert<T extends number | string = number | string>(table: string, data: Record<string, unknown>, ignoreDuplicate = false) {
        await this.initIfNotReady();
        const keys = Object.keys(data);
        const values = Object.values(data);
        const { rows: [res] } = await this.query<{ id: T; }>(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${values.map((val, index) => `$${index + 1}`).join(", ")}) ${ignoreDuplicate ? "ON CONFLICT DO NOTHING " : ""}RETURNING id`, values);
        return ignoreDuplicate ? null : res.id;
    }

    static async query<R extends QueryResultRow, I extends Array<unknown> = Array<unknown>>(queryTextOrConfig: string | QueryConfig<I>, values?: I | undefined) {
        await this.initIfNotReady();
        Debug("db:postgres:query", queryTextOrConfig);
        Debug("db:postgres:queryData", values);
        return this.dbClient.query<R, I>(queryTextOrConfig, values);
    }
}

export const DBLiteral = {
    DEFAULT: Symbol.for("postgres.dbliteral.default")
};

export const DBLiteralReverse = Object.fromEntries(Object.entries(DBLiteral).map(([key, value]) => [value, key])) as Record<symbol, string>;
