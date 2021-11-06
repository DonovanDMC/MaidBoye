// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../util/@types/Node.d.ts" />
import type { RawGuildConfig } from "./Models/Guild/GuildConfig";
import GuildConfig from "./Models/Guild/GuildConfig";
import type { RawUserConfig } from "./Models/User/UserConfig";
import UserConfig from "./Models/User/UserConfig";
import type { RawSelfRole } from "./Models/Guild/SelfRole";
import type { RawSelfRoleJoined } from "./Models/User/SelfRoleJoined";
import type { RawPrefix } from "./Models/Guild/Prefix";
import type { RawTag } from "./Models/Guild/Tag";
import type { RawLogEvent } from "./Models/Guild/LogEvent";
import type { RawDisableEntry } from "./Models/Guild/DisableEntry";
import type { RawLevelRole } from "./Models/Guild/LevelRole";
import type { RawAutoUnarchiveEntry } from "./Models/Guild/AutoUnarchiveEntry";
import Logger from "@util/Logger";
import { beta, defaultPrefix, services } from "@config";
import IORedis from "ioredis";
import Timer from "@util/Timer";
import type { Pool } from "mariadb";
import mariadb from "mariadb";
import { Utility } from "@uwu-codes/utils";
import crypto from "crypto";

export
interface MariaDBUserStats {
	USER: string;
	TOTAL_CONNECTIONS: number;
	CONCURRENT_CONNECTIONS: number;
	CONNECTED_TIME: number;
	BUSY_TIME: number;
	CPU_TIME: number;
	BYTES_RECEIVED: bigint;
	BYTES_SENT: bigint;
	BINLOG_VYTES_WRITTEN: bigint;
	ROWS_READ: bigint;
	ROWS_SENT: bigint;
	ROWS_INSERTED: bigint;
	ROWS_UPDATED: bigint;
	SELECT_COMMANDS: bigint;
	UPDATE_COMMANDS: bigint;
	OTHER_COMMANDS: bigint;
	COMMIT_TRANSACTIONS: bigint;
	ROLLBACK_TRANSACTIONS: bigint;
	DENIED_CONNECTIONS: bigint;
	LOST_CONNECTIONS: bigint;
	ACCESS_DENIED: bigint;
	EMPTY_QUERIES: bigint;
	TOTAL_SSL_CONNECTIONS: bigint;
	MAX_STATEMENT_TIME_EXCEEDED: bigint;
}

export default class db {
	static redisDb: number;
	static r: IORedis.Redis;
	static pool: Pool;
	static rootPool: Pool;

	static async init(sql = true, redis = true) {
		const start = Timer.start();
		if (sql) await this.initMariaDb();
		if (redis) await this.initRedis();
		const end = Timer.end();
		Logger.getLogger("Database[General]").debug(`Initialization complete in ${Timer.calc(start, end, 0, false)}`);
	}

	static async initMariaDb() {
		const uri = `mariadb://${services.mariadb.host}:${services.mariadb.port}`;
		Logger.getLogger("Database[MariaDB]").debug(`Connecting to ${uri} (ssl: ${services.mariadb.ssl ? "Yes" : "No"})`);
		const start = Timer.start();
		try {
			this.pool = mariadb.createPool({
				...services.mariadb,
				database: services.mariadb.db[beta ? "beta" : "prod"]
			});
			this.rootPool = mariadb.createPool({
				...services.mariadb,
				database: services.mariadb.db[beta ? "beta" : "prod"],
				user: "root",
				password: services.mariadb.rootPass
			});
		} catch (err) {
			Logger.getLogger("Database[MariaDB]").error("Error while connecting:", err);
			return;
		}
		const end = Timer.end();
		Logger.getLogger("Database[MariaDB]").debug(`Successfully connected in ${Timer.calc(start, end, 0, false)}`);
	}

	static async initRedis() {
		return new Promise<void>(resolve => {
			this.redisDb = services.redis[beta ? "dbBeta" : "db"];
			const start = Timer.start();
			Logger.getLogger("Database[Redis]").debug(`Connecting to redis://${services.redis.host}:${services.redis.port} using user "${services.redis.username ?? "default"}", and db ${this.redisDb}`);
			this.r = new IORedis(services.redis.port, services.redis.host, {
				username: services.redis.username,
				password: services.redis.password,
				db: this.redisDb,
				connectionName: `MaidBoye${beta ? "Beta" : ""}`,
				enableReadyCheck: true
			});

			this.r
				.on("connect", () => {
					const end = Timer.end();
					Logger.getLogger("Database[Redis]").debug(`Successfully connected in ${Timer.calc(start, end, 0, false)}`);
				})
				.on("ready", () => resolve());
		});
	}

	static async getKeys<T extends (string | number) = string>(pattern: string, get: true, parse?: (val: string) => T): Promise<Record<string, T>>
	static async getKeys<T extends (string | number) = string>(pattern: string, get?: false, parse?: (val: string) => T): Promise<Array<T>>
	static async getKeys<T extends (string | number) = string>(pattern: string, get = false, parse: (val: string) => T = (val) => val as T) {
		return new Promise<Array<T> | Record<string, T>>(resolve => {
			// we use a one off client so we don't block the main one
			const client = new IORedis(services.redis.port, services.redis.host, {
				username: services.redis.username,
				password: services.redis.password,
				db: this.redisDb,
				connectionName: `MaidBoye${beta ? "Beta" : ""}`,
				enableReadyCheck: true
			});
			client.on("ready", async() => {
				const keys = await Utility.getKeys(client, pattern);
				if (get && keys.length > 0) {
					const val = await client.mget(keys) as Array<string>;
					await client.quit();
					return resolve(val.filter(Boolean).map((v,i) => ({
						[keys[i]]: parse(v)
					})).reduce((a,b) => ({ ...a, ...b }), {}));
				}
				await client.quit();
				return resolve(keys as Array<T>);
			});
		});
	}

	static async getStats() {
		return (this.rootQuery("SELECT * FROM INFORMATION_SCHEMA.USER_STATISTICS WHERE USER=?", [services.mariadb.user]) as Promise<[MariaDBUserStats?]>).then(v => v[0]);
	}

	static get query() { return this.pool.query.bind(this.pool); }
	static get rootQuery() { return this.rootPool.query.bind(this.rootPool); }
	static async insert(table: string, data: Record<string, unknown>) {
		const keys = Object.keys(data);
		const values = Object.values(data);
		await this.query(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${values.map(() => "?").join(", ")})`, values);
	}

	static async removeUserFromCache(id: string) {
		await this.r.del(`cache:users:${id}`);
	}

	// because of foreign key restraints
	static async createUserIfNotExists(id: string) { await this.query("INSERT IGNORE INTO users (id) VALUES (?)", [id]); }
	static async getUser(id: string, raw: true, bypassCache?: boolean): Promise<{ user: RawUserConfig; selfRolesJoined: Array<RawSelfRoleJoined>; }>;
	static async getUser(id: string, raw?: false, bypassCache?: boolean): Promise<UserConfig>;
	static async getUser(id: string, raw = false, bypassCache = false) {
		if (bypassCache === true) await this.removeUserFromCache(id);
		const cache = await this.r.get(`cache:users:${id}`);
		if (cache !== null && bypassCache !== true) {
			const v = JSON.parse<{ user: RawUserConfig; selfRolesJoined: Array<RawSelfRoleJoined>; }>(cache);
			if (v === undefined || v.user === undefined || v.selfRolesJoined === undefined) return this.getUser(id, raw as true);
			if (raw) return v;
			else return new UserConfig(id, v.user, v.selfRolesJoined);
		}
		const start = Timer.start();
		let [res] = await Promise.all([
			this.pool.query("SELECT * FROM users WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawUserConfig>)[0])
		]);
		const [selfRolesJoined] = await Promise.all([
			this.pool.query("SELECT * FROM selfrolesjoined WHERE user_id=?", [id]).then<Array<RawSelfRoleJoined>>()
		]);
		if (res === undefined) {
			await this.pool.query("INSERT INTO users (id) VALUES (?)", [id]);
			Logger.getLogger("Database[MariaDB]").debug(`Created the user entry "${id}".`);
			res = await this.pool.query("SELECT * FROM users WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawUserConfig>)[0]);
		}
		const end = Timer.end();

		// if we somehow get another undefined
		if (res === undefined) throw new TypeError("Unexpected undefined user in db#getUser");

		if (beta) Logger.getLogger("Database[MariaDB]").debug(`Query for the user "${id}" took ${Timer.calc(start, end, 0, false)}`);

		await this.r.setex(`cache:users:${id}`, 300, JSON.stringify({ user: res, selfRolesJoined }, (k, v: unknown) => typeof v === "bigint" ? String(v) : v));

		if (raw) return {
			user: res,
			selfRolesJoined
		};
		else return new UserConfig(id, res, selfRolesJoined);
	}

	static async removeGuildFromCache(id: string) {
		await this.r.del(`cache:guilds:${id}`);
	}

	static async createGuildIfNotExists(id: string) { await this.query("INSERT IGNORE INTO guilds (id) VALUES (?)", [id]); }
	static async getGuild(id: string, raw: true, bypassCache?: boolean): Promise<{
		guild: RawGuildConfig;
		prefix: Array<RawPrefix>;
		selfRoles: Array<RawSelfRole>;
		levelRoles: Array<RawLevelRole>;
		tags: Array<RawTag>;
		logEvents: Array<RawLogEvent>;
		disable: Array<RawDisableEntry>;
		autoUnarchiveEntry: Array<RawAutoUnarchiveEntry>;
	}>;
	static async getGuild(id: string, raw?: false, bypassCache?: boolean): Promise<GuildConfig>;
	static async getGuild(id: string, raw = false, bypassCache = false) {
		if (bypassCache === true) await this.removeGuildFromCache(id);
		const cache = await this.r.get(`cache:guilds:${id}`);
		if (cache !== null && bypassCache !== true) {
			const v = JSON.parse<{
				guild: RawGuildConfig;
				prefix: Array<RawPrefix>;
				selfRoles: Array<RawSelfRole>;
				levelRoles: Array<RawLevelRole>;
				tags: Array<RawTag>;
				logEvents: Array<RawLogEvent>;
				autoUnarchiveEntry: Array<RawAutoUnarchiveEntry>;
				disable: Array<RawDisableEntry>;
			}>(cache);
			if (v === undefined || v.guild === undefined || v.prefix === undefined || v.selfRoles === undefined || v.levelRoles === undefined || v.tags === undefined || v.logEvents === undefined || v.disable === undefined || v.autoUnarchiveEntry === undefined) return this.getGuild(id, raw as true);
			if (raw) return v;
			else return new GuildConfig(id, v.guild, v.prefix, v.selfRoles, v.levelRoles, v.tags, v.logEvents, v.disable, v.autoUnarchiveEntry);
		}
		const start = Timer.start();
		let [res, prefix] = await Promise.all([
			this.pool.query("SELECT * FROM guilds WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawGuildConfig>)[0]),
			this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then<Array<RawPrefix>>()
		]);
		const [selfRoles, levelRoles, tags, logEvents, disable, autoUnarchiveEntry] = await Promise.all([
			this.pool.query("SELECT * FROM selfroles WHERE guild_id=?", [id]).then<Array<RawSelfRole>>(),
			this.pool.query("SELECT * FROM levelroles WHERE guild_id=?", [id]).then<Array<RawLevelRole>>(),
			this.pool.query("SELECT * FROM tags WHERE guild_id=?", [id]).then<Array<RawTag>>(),
			this.pool.query("SELECT * FROM logevents WHERE guild_id=?", [id]).then<Array<RawLogEvent>>(),
			this.pool.query("SELECT * FROM disable WHERE guild_id=?", [id]).then<Array<RawDisableEntry>>(),
			this.pool.query("SELECT * FROM autounarchive WHERE guild_id=?", [id]).then<Array<RawAutoUnarchiveEntry>>()
		]);
		if (res === undefined) {
			await this.pool.query("INSERT INTO guilds (id) VALUES (?)", [id]);
			await this.pool.query("INSERT INTO prefix (id, guild_id, value, space) VALUES (?, ?, ?, ?)", [crypto.randomBytes(6).toString("hex"), id, defaultPrefix, true]);
			Logger.getLogger("Database[MariaDB]").debug(`Created the guild entry "${id}".`);
			res = await this.pool.query("SELECT * FROM guilds WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawGuildConfig>)[0]);
			prefix = await this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then(v => (v as Array<RawPrefix>));
		}
		const end = Timer.end();

		if (prefix.length === 0) {
			Logger.getLogger("Database[MariaDB]").warn(`Found guild "${id}" with zero prefixes, fixing..`);
			await this.pool.query("INSERT INTO prefix (id, guild_id, value, space) VALUES (?, ?, ?, ?)", [crypto.randomBytes(6).toString("hex"), id, defaultPrefix, true]);
			prefix = await this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then(v => (v as Array<RawPrefix>));
		}

		// null yes
		// if we somehow get another null
		if (res === undefined) throw new TypeError("Unexpected undefined guild in db#getGuild");

		if (beta) Logger.getLogger("Database[MariaDB]").debug(`Query for the guild "${id}" took ${Timer.calc(start, end, 0, false)}`);

		await this.r.setex(`cache:guilds:${id}`, 300, JSON.stringify({ guild: res, prefix, selfRoles, levelRoles, tags, logEvents, disable, autoUnarchiveEntry }, (k, v: unknown) => typeof v === "bigint" ? String(v) : v));

		if (raw) return {
			guild: res,
			prefix,
			selfRoles,
			levelRoles,
			tags,
			logEvents,
			disable,
			autoUnarchiveEntry
		};
		else return new GuildConfig(id, res, prefix, selfRoles, levelRoles, tags, logEvents, disable, autoUnarchiveEntry);
	}
}
