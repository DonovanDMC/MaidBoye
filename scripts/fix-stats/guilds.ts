import services from "../../src/config/extra/other/services.json";
import IORedis from "ioredis";
import { Utility } from "@uwu-codes/utils";

const beta = !process.argv.includes("--prod");
process.nextTick(async() => {
	const r = new IORedis(services.redis.port, services.redis.host, {
		username: services.redis.username,
		password: services.redis.password,
		db: beta ? 3 : 2,
		connectionName: `MaidBoye${beta ? "Beta" : ""}`,
		enableReadyCheck: true
	});
	const keys = await Utility.getKeys(r, "stats:guilds:*users:*:commands:*");
	const val = await r.mget(keys);
	console.log("Total Keys:", keys.length);
	const res = {} as Record<string, number>;
	keys.map((key,i) => {
		const g = key.split(":")[2];
		const u = key.split(":")[4];
		res[`${g}.${u}`] = (res[`${g}.${u}`] ?? 0) + (Number(val[i] ?? 0));
	});

	console.log("Total Updates:", Object.entries(res).length);
	await r.mset(...Object.entries(res).reduce((a,[b, c]) => a.concat([`stats:guilds:${b.split(".")[0]}:users:${b.split(".")[1]}:commands`, c]), [] as Array<string | number>));

	console.log("Done.");
	process.exit(0);
});
