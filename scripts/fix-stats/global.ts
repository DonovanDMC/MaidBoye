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
	const keys = await Utility.getKeys(r, "stats:commands:*");
	const val = await r.mget(keys);
	console.log("Total Keys:", keys.length);


	console.log("Total Updates:", 1);
	await r.set("stats:commands", val.reduce((a, b) => Number(a) + Number(b), 0));

	console.log("Done.");
	process.exit(0);
});
