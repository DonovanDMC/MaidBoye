import GuildConfig, { GuildConfigKV, UserReport } from "./Models/GuildConfig";
import UserConfig, { UserConfigKV } from "./Models/UserConfig";
import config from "../config";
import Logger from "../util/Logger";
import IORedis from "ioredis";
import { Collection, MongoClient, MongoClientOptions } from "mongodb";
import { performance } from "perf_hooks";


export default class db {
	static mainDB: string;
	static redisDb: number;
	static mongo: MongoClient;
	static r: IORedis.Redis;

	static async init(mongo = true, redis = true) {
		const start = performance.now();
		if (mongo) await this.initMongo();
		if (redis) await this.initRedis();
		const end = performance.now();
		Logger.getLogger("Database[General]").debug(`Initialization complete in ${(end - start).toFixed(3)}ms`);
	}

	static async initMongo() {
		this.mainDB = config.services.mongo[config.beta ? "dbBeta" : "db"];
		const uri = `mongodb://${config.services.mongo.host}:${config.services.mongo.port}/${config.services.mongo.authSource}?authSource=${config.services.mongo.authSource}`;
		Logger.getLogger("Database[MongoDB]").debug(`Connecting to ${uri} (ssl: ${config.services.mongo.options.ssl ? "Yes" : "No"})`);
		const start = performance.now();
		try {
			this.mongo = await MongoClient.connect(uri, {
				appname: `Maid Boye${config.beta ? " Beta" : ""}`,
				...config.services.mongo.options as MongoClientOptions // because json
			});
		} catch (err) {
			Logger.getLogger("Database[MongoDB]").error("Error while connecting:", err);
			return;
		}
		const end = performance.now();
		Logger.getLogger("Database[MongoDB]").debug(`Successfully connected in ${(end - start).toFixed(3)}ms`);
	}

	static async initRedis() {
		return new Promise<void>(resolve => {
			this.redisDb = config.services.redis[config.beta ? "dbBeta" : "db"];
			const start = performance.now();
			Logger.getLogger("Database[Redis]").debug(`Connecting to redis://${config.services.redis.host}:${config.services.redis.port} using user "${config.services.redis.username ?? "default"}", and db ${this.redisDb}`);
			this.r = new IORedis(config.services.redis.port, config.services.redis.host, {
				username: config.services.redis.username,
				password: config.services.redis.password,
				db: this.redisDb,
				connectionName: `MaidBoye${config.beta ? "Beta" : ""}`
			});

			this.r.on("connect", () => {
				const end = performance.now();
				Logger.getLogger("Database[Redis]").debug(`Successfully connected in ${(end - start).toFixed(3)}ms`);
				resolve();
			});
		});
	}

	static get mdb() { return this.mongo.db(this.mainDB); }

	/* eslint-disable @typescript-eslint/unified-signatures */
	static collection<T = UserReport>(name: "reports"): Collection<T>;
	static collection<T = GuildConfigKV>(name: "guilds"): Collection<T>;
	static collection<T = UserConfigKV>(name: "users"): Collection<T>;
	static collection<T = unknown>(name: string) {
		return this.mdb.collection<T>(name);
	}
	/* eslint-enable @typescript-eslint/unified-signatures */

	static async getUser(id: string) {
		const start = performance.now();
		let res = await this.collection("users").findOne({ id });
		if (res === null) {
			res = await this.collection("users").insertOne({
				...config.defaults.user,
				id
			}).then(v => v.ops[0]);
			Logger.getLogger("Database[MongoDB]").debug(`Created the user entry "${id}".`);
		}
		const end = performance.now();

		// if we somehow get another null
		if (res === null) throw new TypeError("Unexpected null user in db#getUser");

		if (config.beta) Logger.getLogger("Database[MongoDB]").debug(`Query for the user "${id}" took ${(end - start).toFixed(3)}ms`);

		return new UserConfig(id, res);
	}

	static async getGuild(id: string) {
		const start = performance.now();
		let res = await this.collection("guilds").findOne({ id });
		if (res === null) {
			// @ts-ignore this errors because defaults has generic numbers, and not exact numbers
			res = await this.collection("guilds").insertOne({
				...config.defaults.guild,
				id
			}).then(v => v.ops[0]);
			Logger.getLogger("Database[MongoDB]").debug(`Created the guild entry "${id}".`);
		}
		const end = performance.now();

		// if we somehow get another null
		if (res === null) throw new TypeError("Unexpected null guild in db#getGuild");

		if (config.beta) Logger.getLogger("Database[MongoDB]").debug(`Query for the guild "${id}" took ${(end - start).toFixed(3)}ms`);

		return new GuildConfig(id, res);
	}
}
