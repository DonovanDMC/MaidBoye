import { mariadb as dbConfig } from "../src/config/extra/other/services.json";
import mariadb from "mariadb";
import * as fs from "fs-extra";

const db = "maid";
const dbBeta = "maidbeta";
const schemaDir = `${__dirname}/../src/db/Schema`;
process.nextTick(async() => {
	let beta = process.argv.join(" ").includes("--beta");
	let database = beta ? dbBeta : db;

	if (beta === false) {
		process.stdout.write("!WARING! This will delete and recreate the PRODUCTION database, are you sure you want to do this? (y/b/N)\n> ");
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

	const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${database}'`).then((v: Array<{ table_name: string; }>) => v.map(d => d.table_name));
	for (const t of tables) await pool.query(`SET FOREIGN_KEY_CHECKS=0; DROP TABLE ${database}.${t}`);
	const schemaList = fs.readdirSync(schemaDir).map(v => [
		v,
		fs.readFileSync(`${schemaDir}/${v}/table.sql`).toString(),
		fs.readFileSync(`${schemaDir}/${v}/constraints.sql`).toString().split("\n")
	] as [name: string, table: string, constraints: Array<string>]);

	for (const [name, schema] of schemaList) {
		console.log(`Creating table "${name}"`);
		await pool.query(schema);
		console.log(`Finished creating table "${name}"`);
	}

	for (const [name,,constraints] of schemaList) {
		console.log(`Creating schema for "${name}"`);
		for (const s of constraints) await pool.query(s);
		console.log(`Finished creating schema for "${name}"`);
	}

	console.log("Done.");

	process.exit(0);
});
