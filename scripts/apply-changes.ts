import { mariadb as dbConfig } from "../src/config/extra/other/services.json";
import mariadb from "mariadb";
import * as fs from "fs-extra";

const db = "maid";
const dbBeta = "maidbeta";
const schemaDir = `${__dirname}/../src/db/Schema`;
process.nextTick(async() => {
	let beta = process.argv.join(" ").includes("--beta");
	let database = beta ? dbBeta : db;

	console.log("Using Database:", database);
	if (beta === false) {
		process.stdout.write("!WARING! This will apply the current changes to the PRODUCTION database, are you sure you want to do this? (y/b/N)\n> ");
		await new Promise<void>((resolve, reject) => {
			process.stdin.on("data", (d) => {
				const v = d.toString().replace(/\r?\n/, "");
				if (v === "y") {
					process.stdout.moveCursor(0, -1);
					process.stdout.clearLine(0);
					process.stdout.write("> continuing\n\n");
					resolve();
				} else if (v === "b") {
					process.stdout.moveCursor(0, -1);
					process.stdout.clearLine(0);
					process.stdout.write("> switching to beta\n\n");
					beta = true;
					database = dbBeta;
					resolve();
				} else {
					process.stdout.moveCursor(0, -1);
					process.stdout.clearLine(0);
					process.stdout.write("> Cancelled.\n\n");
					reject("cancelled");
				}
			});
		});
	}

	const pool = mariadb.createPool({
		...dbConfig,
		database,
		multipleStatements: true,
		connectionLimit: Infinity
	});

	const schemas = fs.readdirSync(schemaDir);

	for (const schema of schemas) {
		console.log("Processing Schema %s", schema);
		const tableSql = fs.readFileSync(`${schemaDir}/${schema}/table.sql`).toString();
		const migrateSql = fs.readFileSync(`${schemaDir}/${schema}/migrate.sql`).toString();
		const exists = await pool.query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1", [database, schema]).then((r: Array<unknown>) => r.length !== 0);
		if (exists) console.log("Schema %s already exists, not creating..", schema);
		else {
			console.log("Creating schema %s", schema);
			await pool.query(tableSql);
		}
		await pool.query(migrateSql);
	}


	process.exit(0);
});
