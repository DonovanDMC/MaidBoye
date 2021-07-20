import GuildConfig, { GuildConfigKV, UserReport } from "./Models/GuildConfig";
import UserConfig, { UserConfigKV } from "./Models/UserConfig";
import Logger from "@util/Logger";
import config from "@config";
import IORedis from "ioredis";
import { Collection, MongoClient, MongoClientOptions } from "mongodb";
import Timer from "@util/Timer";
import { AnyEntry } from "@util/@types/ModLog";
import { TimedEntry } from "@util/handlers/ModLogHandler";


export default class db {
	static mainDB: string;
	static redisDb: number;
	static mongo: MongoClient;
	static r: IORedis.Redis;

	static async init(mongo = true, redis = true) {
		const start = Timer.start();
		if (mongo) await this.initMongo();
		if (redis) await this.initRedis();
		const end = Timer.end();
		Logger.getLogger("Database[General]").debug(`Initialization complete in ${Timer.calc(start, end)}ms`);
	}

	static async initMongo() {
		this.mainDB = config.services.mongo[config.beta ? "dbBeta" : "db"];
		const uri = `mongodb://${config.services.mongo.host}:${config.services.mongo.port}/${config.services.mongo.authSource}?authSource=${config.services.mongo.authSource}`;
		Logger.getLogger("Database[MongoDB]").debug(`Connecting to ${uri} (ssl: ${config.services.mongo.options.ssl ? "Yes" : "No"})`);
		const start = Timer.start();
		try {
			this.mongo = await MongoClient.connect(uri, {
				appName: `Maid Boye${config.beta ? " Beta" : ""}`,
				...config.services.mongo.options as MongoClientOptions // because json
			});
		} catch (err) {
			Logger.getLogger("Database[MongoDB]").error("Error while connecting:", err);
			return;
		}
		const end = Timer.end();
		Logger.getLogger("Database[MongoDB]").debug(`Successfully connected in ${end - start}ms`);
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

	static get mdb() { return this.mongo.db(this.mainDB); }

	/* eslint-disable @typescript-eslint/unified-signatures */
	static collection<T = UserReport>(name: "reports"): Collection<T>;
	static collection<T = TimedEntry>(name: "timed"): Collection<T>;
	static collection<T = AnyEntry>(name: "modlog"): Collection<T>;
	static collection<T = GuildConfigKV>(name: "guilds"): Collection<T>;
	static collection<T = UserConfigKV>(name: "users"): Collection<T>;
	static collection<T = unknown>(name: string) {
		return this.mdb.collection<T>(name);
	}
	/* eslint-enable @typescript-eslint/unified-signatures */

	static async getUser(id: string) {
		const start = Timer.start();
		let res = await this.collection("users").findOne({ id });
		if (res === undefined) {
			res = await this.collection("users").insertOne({
				...config.defaults.user,
				id
			}).then(() => new UserConfig(id, { ...config.defaults.user, id }));
			Logger.getLogger("Database[MongoDB]").debug(`Created the user entry "${id}".`);
		}
		const end = Timer.end();

		// if we somehow get another undefined
		if (res === undefined) throw new TypeError("Unexpected undefined user in db#getUser");

		if (config.beta) Logger.getLogger("Database[MongoDB]").debug(`Query for the user "${id}" took ${Timer.calc(start, end)}ms`);

		return new UserConfig(id, res);
	}

	static async getGuild(id: string) {
		const start = Timer.start();
		let res = await this.collection("guilds").findOne({ id });
		if (res === undefined) {
			// @ts-ignore this errors because defaults has generic numbers, and not exact numbers
			res = await this.collection("guilds").insertOne({
				...config.defaults.guild,
				id
				// @ts-ignore json doesn't match strictly types properties
			}).then(() => new GuildConfig(id, { ...config.defaults.guild, id }));
			Logger.getLogger("Database[MongoDB]").debug(`Created the guild entry "${id}".`);
		}
		const end = Timer.end();

		// if we somehow get another null
		if (res === undefined) throw new TypeError("Unexpected undefined guild in db#getGuild");

		if (config.beta) Logger.getLogger("Database[MongoDB]").debug(`Query for the guild "${id}" took ${Timer.calc(start, end)}ms`);

		return new GuildConfig(id, res);
	}
}
