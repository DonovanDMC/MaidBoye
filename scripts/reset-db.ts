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
		process.stdout.write("!WARING! This will delete and recreate all indexes on the PRODUCTION database, are you sure you want to do this? (y/b/N)\n> ");
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

	const tables = await pool.query("SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?", [database]).then((res: Array<Record<"TABLE_NAME", string>>) => res.map(r => r.TABLE_NAME));
	const foreignKeys: Array<Record<"t" | "k", string>> = [], indexes: Array<Record<"t" | "i", string>> = [];
	for (const table of tables) {
		console.log("Querying %s.%s", database, table);
		foreignKeys.push(...(await pool.query("SELECT DISTINCT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME != 'PRIMARY' AND REFERENCED_TABLE_NAME IS NOT NULL AND REFERENCED_COLUMN_NAME IS NOT NULL", [database, table]).then((res: Array<Record<"CONSTRAINT_NAME", string>>) => res.map(r => ({ t: table, k: r.CONSTRAINT_NAME })))));
		indexes.push(...(await pool.query("SELECT DISTINCT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?  AND INDEX_NAME != 'PRIMARY'", [database, table]).then((res: Array<Record<"INDEX_NAME", string>>) => res.map(r => ({ t: table, i: r.INDEX_NAME })))));
	}

	for (const { t, k } of foreignKeys) {
		console.log("Deleting foreign key %s on %s.%s", k, database, t);
		await pool.query(`ALTER TABLE ${database}.${t} DROP FOREIGN KEY ${k}`);
	}
	for (const { t, i } of indexes) {
		console.log("Deleting index %s on %s.%s", i, database, t);
		console.log(`ALTER TABLE ${database}.${t} DROP INDEX ${i}`);
		await pool.query(`ALTER TABLE ${database}.${t} DROP INDEX ${i}`);
	}

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
