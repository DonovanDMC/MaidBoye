// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../util/@types/Node.d.ts" />
import GuildConfig, { RawGuildConfig } from "./Models/Guild/GuildConfig";
import UserConfig, { RawUserConfig } from "./Models/User/UserConfig";
import { RawSelfRole } from "./Models/Guild/SelfRole";
import { RawSelfRoleJoined } from "./Models/User/SelfRoleJoined";
import { RawPrefix } from "./Models/Guild/Prefix";
import { RawTag } from "./Models/Guild/Tag";
import { RawLogEvent } from "./Models/Guild/LogEvent";
import Logger from "@util/Logger";
import config from "@config";
import IORedis from "ioredis";
import Timer from "@util/Timer";
import mariadb, { Pool } from "mariadb";
import crypto from "crypto";


export default class db {
	static redisDb: number;
	static r: IORedis.Redis;
	static pool: Pool;

	static async init(sql = true, redis = true) {
		const start = Timer.start();
		if (sql) await this.initMariaDb();
		if (redis) await this.initRedis();
		const end = Timer.end();
		Logger.getLogger("Database[General]").debug(`Initialization complete in ${Timer.calc(start, end)}ms`);
	}

	static async initMariaDb() {
		const uri = `mariadb://${config.services.mariadb.host}:${config.services.mariadb.port}`;
		Logger.getLogger("Database[MariaDB]").debug(`Connecting to ${uri} (ssl: ${config.services.mariadb.ssl ? "Yes" : "No"})`);
		const start = Timer.start();
		try {
			this.pool = mariadb.createPool({
				...config.services.mariadb,
				database: config.services.mariadb.db[config.beta ? "beta" : "prod"]
			});
		} catch (err) {
			Logger.getLogger("Database[MariaDB]").error("Error while connecting:", err);
			return;
		}
		const end = Timer.end();
		Logger.getLogger("Database[MariaDB]").debug(`Successfully connected in ${end - start}ms`);
	}

	static async initRedis() {
		return new Promise<void>(resolve => {
			this.redisDb = config.services.redis[config.beta ? "dbBeta" : "db"];
			const start = Timer.start();
			Logger.getLogger("Database[Redis]").debug(`Connecting to redis://${config.services.redis.host}:${config.services.redis.port} using user "${config.services.redis.username ?? "default"}", and db ${this.redisDb}`);
			this.r = new IORedis(config.services.redis.port, config.services.redis.host, {
				username: config.services.redis.username,
				password: config.services.redis.password,
				db: this.redisDb,
				connectionName: `MaidBoye${config.beta ? "Beta" : ""}`
			});

			this.r.on("connect", () => {
				const end = Timer.end();
				Logger.getLogger("Database[Redis]").debug(`Successfully connected in ${Timer.calc(start, end)}ms`);
				resolve();
			});
		});
	}

	static get query() { return this.pool.query.bind(this.pool); }
	static async insert(table: string, data: Record<string, unknown>) {
		const keys = Object.keys(data);
		const values = Object.values(data);
		await this.query(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${values.map(() => "?").join(", ")})`, values);
	}

	// because of foreign key restraints
	static async createUserIfNotExists(id: string) { await this.query("INSERT IGNORE INTO users (id) VALUES (?)", [id]); }
	static async getUser(id: string, raw: true, bypassCache?: boolean): Promise<{ user: RawUserConfig; selfRolesJoined: Array<RawSelfRoleJoined>; }>;
	static async getUser(id: string, raw?: false, bypassCache?: boolean): Promise<UserConfig>;
	static async getUser(id: string, raw = false, bypassCache = false) {
		if (bypassCache === true) await this.r.del(`cache:users:${id}`);
		const cache = await this.r.get(`cache:users:${id}`);
		if (cache !== null && bypassCache !== true) {
			const v = JSON.parse<{ user: RawUserConfig; selfRolesJoined: Array<RawSelfRoleJoined>; }>(cache);
			if (v === undefined || v.user === undefined || v.selfRolesJoined === undefined) return this.getUser(id, raw as true);
			if (raw) return v;
			else return new UserConfig(id, v.user, v.selfRolesJoined);
		}
		const start = Timer.start();
		let res = await this.pool.query("SELECT * FROM users WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawUserConfig>)[0]);
		const selfRolesJoined = await this.pool.query("SELECT * FROM selfrolesjoined WHERE user_id=?", [id]).then(v => (v as Array<RawSelfRoleJoined>));
		if (res === undefined) {
			await this.pool.query("INSERT INTO users (id) VALUES (?)", [id]);
			Logger.getLogger("Database[MariaDB]").debug(`Created the user entry "${id}".`);
			res = await this.pool.query("SELECT * FROM users WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawUserConfig>)[0]);
		}
		const end = Timer.end();

		// if we somehow get another undefined
		if (res === undefined) throw new TypeError("Unexpected undefined user in db#getUser");

		if (config.beta) Logger.getLogger("Database[MariaDB]").debug(`Query for the user "${id}" took ${Timer.calc(start, end)}ms`);

		await this.r.setex(`cache:users:${id}`, 300, JSON.stringify({ user: res, selfRolesJoined }));

		if (raw) return {
			user: res,
			selfRolesJoined
		};
		else return new UserConfig(id, res, selfRolesJoined);
	}

	static async createGuildIfNotExists(id: string) { await this.query("INSERT IGNORE INTO guilds (id) VALUES (?)", [id]); }
	static async getGuild(id: string, raw: true, bypassCache?: boolean): Promise<{
		guild: RawGuildConfig;
		prefix: Array<RawPrefix>;
		selfRoles: Array<RawSelfRole>;
		tags: Array<RawTag>;
		logEvents: Array<RawLogEvent>;
	}>;
	static async getGuild(id: string, raw?: false, bypassCache?: boolean): Promise<GuildConfig>;
	static async getGuild(id: string, raw = false, bypassCache = false) {
		if (bypassCache === true) await this.r.del(`cache:guilds:${id}`);
		const cache = await this.r.get(`cache:guilds:${id}`);
		if (cache !== null && bypassCache !== true) {
			const v = JSON.parse<{
				guild: RawGuildConfig;
				prefix: Array<RawPrefix>;
				selfRoles: Array<RawSelfRole>;
				tags: Array<RawTag>;
				logEvents: Array<RawLogEvent>;
			}>(cache);
			if (v === undefined || v.guild === undefined || v.prefix === undefined || v.selfRoles === undefined || v.tags === undefined || v.logEvents === undefined) return this.getGuild(id, raw as true);
			if (raw) return v;
			else return new GuildConfig(id, v.guild, v.prefix, v.selfRoles, v.tags, v.logEvents);
		}
		const start = Timer.start();
		let res = await this.pool.query("SELECT * FROM guilds WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawGuildConfig>)[0]);
		let prefix = await this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then(v => (v as Array<RawPrefix>));
		const selfRoles = await this.pool.query("SELECT * FROM selfroles WHERE guild_id=?", [id]).then(v => (v as Array<RawSelfRole>));
		const tags = await this.pool.query("SELECT * FROM tags WHERE guild_id=?", [id]).then(v => (v as Array<RawTag>));
		const logEvents = await this.pool.query("SELECT * FROM logevents WHERE guild_id=?", [id]).then(v => (v as Array<RawLogEvent>));
		if (res === undefined) {
			await this.pool.query("INSERT INTO guilds (id) VALUES (?)", [id]);
			await this.pool.query("INSERT INTO prefix (id, guild_id, value, space) VALUES (?, ?, ?, ?)", [crypto.randomBytes(6).toString("hex"), id, config.defaults.prefix, true]);
			Logger.getLogger("Database[MariaDB]").debug(`Created the guild entry "${id}".`);
			res = await this.pool.query("SELECT * FROM guilds WHERE id=? LIMIT 1", [id]).then(v => (v as Array<RawGuildConfig>)[0]);
			prefix = await this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then(v => (v as Array<RawPrefix>));
		}
		const end = Timer.end();

		if (prefix.length === 0) {
			Logger.getLogger("Database[MariaDB]").warn(`Found guild "${id}" with zero prefixes, fixing..`);
			await this.pool.query("INSERT INTO prefix (id, guild_id, value, space) VALUES (?, ?, ?, ?)", [crypto.randomBytes(6).toString("hex"), id, config.defaults.prefix, true]);
			prefix = await this.pool.query("SELECT * FROM prefix WHERE guild_id=?", [id]).then(v => (v as Array<RawPrefix>));
		}

		// null yes
		// if we somehow get another null
		if (res === undefined) throw new TypeError("Unexpected undefined guild in db#getGuild");

		if (config.beta) Logger.getLogger("Database[MariaDB]").debug(`Query for the guild "${id}" took ${Timer.calc(start, end)}ms`);

		await this.r.setex(`cache:guilds:${id}`, 300, JSON.stringify({ guild: res, prefix, selfRoles, tags, logEvents }));

		if (raw) return {
			guild: res,
			prefix,
			selfRoles,
			tags,
			logEvents
		};
		else return new GuildConfig(id, res, prefix, selfRoles, tags, logEvents);
	}
}
