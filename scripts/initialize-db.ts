import { mariadb as dbConfig } from "../src/config/extra/other/services.json";
import mariadb from "mariadb";

process.nextTick(async() => {
	const pool = mariadb.createPool({
		...dbConfig,
		database: "maid",
		multipleStatements: true
	});

	const userProps = {
		id: "VARCHAR(21) NOT NULL UNIQUE",
		self_roles_joined: "MEDIUMTEXT NOT NULL DEFAULT '[]'",
		premium_kofi_email: "TINYTEXT NULL",
		premium_months: "TINYINT UNSIGNED NOT NULL DEFAULT 0",
		premium_subscription: "BOOLEAN NOT NULL DEFAULT FALSE",
		premium_total_amount: "SMALLINT UNSIGNED NOT NULL DEFAULT 0"
	};

	console.log("Creating Users Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS users");
	await pool.query(`CREATE TABLE users (${Object.entries(userProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	console.log("Created Users Table");

	console.log("----------");

	const guildProps = {
		id: "VARCHAR(21) NOT NULL UNIQUE",
		modlog_enabled: "BOOLEAN NOT NULL DEFAULT FALSE",
		modlog_case_editing_enabled: "BOOLEAN NOT NULL DEFAULT TRUE",
		modlog_case_deleting_enabled: "BOOLEAN NOT NULL DEFAULT FALSE",
		modlog_edit_others_cases_enabled: "BOOLEAN NOT NULL DEFAULT FALSE",
		modlog_webhook_id: "VARCHAR(21) NULL",
		modlog_webhook_token: "TINYTEXT NULL",
		modlog_webhook_channel_id: "VARCHAR(21) NULL",
		settings_default_yiff_type: "TINYTEXT NOT NULL DEFAULT 'gay'",
		settings_yiff_thumbnail_type: "TINYTEXT NOT NULL DEFAULT 'image'",
		settings_mute_role: "VARCHAR(21) NULL",
		settings_command_images: "BOOLEAN NOT NULL DEFAULT FALSE"
	};

	console.log("Creating Guilds Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS guilds");
	await pool.query(`CREATE TABLE guilds (${Object.entries(guildProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	console.log("Created Guilds Table");

	console.log("----------");

	const prefixProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		value: "VARCHAR(25) NOT NULL",
		space: "BOOLEAN NOT NULL DEFAULT FALSE"
	};

	console.log("Creating Prefix Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS prefix");
	await pool.query(`CREATE TABLE prefix (${Object.entries(prefixProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("ALTER TABLE prefix ADD UNIQUE value_guild (value, guild_id)");
	await pool.query("CREATE INDEX guild_id ON prefix (guild_id)");
	console.log("Created Prefix Table");

	console.log("----------");

	const tagProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		name: "TINYTEXT NOT NULL",
		content: "MEDIUMTEXT NOT NULL",
		created_at: "BIGINT UNSIGNED NOT NULL",
		created_by: "VARCHAR(21) NOT NULL",
		modified_at: "BIGINT UNSIGNED NULL",
		modified_by: "VARCHAR(21) NULL"
	};

	console.log("Creating Tags Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS tags");
	await pool.query(`CREATE TABLE tags (${Object.entries(tagProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("ALTER TABLE tags ADD UNIQUE tag_guild (name, guild_id)");
	await pool.query("CREATE INDEX name ON tags (name)");
	await pool.query("CREATE INDEX guild_id ON tags (guild_id)");
	console.log("Created Tags Table");

	console.log("----------");

	const selfRolesProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		role: "VARCHAR(21) NOT NULL",
		added_at: "BIGINT UNSIGNED NOT NULL",
		added_by: "VARCHAR(21) NOT NULL"
	};

	console.log("Creating SelfRoles Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS selfroles");
	await pool.query(`CREATE TABLE selfroles (${Object.entries(selfRolesProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("ALTER TABLE selfroles ADD UNIQUE role_guild (role, guild_id)");
	await pool.query("CREATE INDEX role ON selfroles (role)");
	await pool.query("CREATE INDEX guild_id ON selfroles (guild_id)");
	console.log("Created SelfRoles Table");

	console.log("----------");

	const selfRolesJoinedProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		user_id: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		role: "VARCHAR(21) NOT NULL"
	};

	console.log("Creating SelfRolesJoined Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS selfrolesjoined");
	await pool.query(`CREATE TABLE selfrolesjoined (${Object.entries(selfRolesJoinedProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("ALTER TABLE selfrolesjoined ADD UNIQUE role_guild (role, guild_id)");
	await pool.query("CREATE INDEX role ON selfrolesjoined (role)");
	await pool.query("CREATE INDEX guild_id ON selfrolesjoined (guild_id)");
	console.log("Created SelfRoles Table");

	console.log("----------");

	const strikeProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		group_id: "CHAR(12) NOT NULL",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		user_id: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		created_by: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		created_at: "BIGINT UNSIGNED NOT NULL"
	};

	console.log("Creating Strikes Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS strikes");
	await pool.query(`CREATE TABLE strikes (${Object.entries(strikeProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("CREATE INDEX guild_id ON strikes (guild_id)");
	await pool.query("CREATE INDEX user_id ON strikes (user_id)");
	await pool.query("CREATE INDEX created_by ON strikes (created_by)");
	await pool.query("CREATE INDEX group_id ON strikes (group_id)");
	console.log("Created Strikes Table");

	console.log("----------");

	const timedProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		type: "TINYTEXT NOT NULL",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		user_id: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		time: "BIGINT NOT NULL",
		expiry: "BIGINT NOT NULL"
	};

	console.log("Creating Timed Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS timed");
	await pool.query(`CREATE TABLE timed (${Object.entries(timedProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("CREATE INDEX type ON timed (type)");
	await pool.query("CREATE INDEX guild_id ON timed (guild_id)");
	await pool.query("CREATE INDEX user_id ON timed (user_id)");
	await pool.query("CREATE INDEX expiry ON timed (expiry)");
	console.log("Created Timed Table");

	console.log("----------");

	const modlogProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		entry_id: "MEDIUMINT UNSIGNED NOT NULL",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		message_id: "VARCHAR(21) NULL UNIQUE",
		strike_id: "CHAR(12) NULL UNIQUE REFERENCES strikes(id)",
		target: "VARCHAR(21) NOT NULL",
		blame: "VARCHAR(21) NOT NULL",
		reason: "TINYTEXT NULL",
		type: "TINYTEXT NOT NULL",
		created_at: "BIGINT UNSIGNED NOT NULL",
		last_edited_at: "BIGINT UNSIGNED NULL",
		last_edited_by: "VARCHAR(21) NULL",
		// fields for certain types
		delete_days: "INT UNSIGNED NULL",
		timed_id: "VARCHAR(12) NULL REFERENCES timed(id)",
		warning_id: "TINYINT UNSIGNED NULL",
		total: "INT UNSIGNED NULL",
		active: "BOOLEAN NULL"
	};

	console.log("Creating ModLog Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS modlog");
	await pool.query(`CREATE TABLE modlog (${Object.entries(modlogProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("ALTER TABLE modlog ADD UNIQUE entryid_guild (entry_id, guild_id)");
	await pool.query("CREATE INDEX entry_id ON modlog (entry_id)");
	await pool.query("CREATE INDEX guild_id ON modlog (guild_id)");
	await pool.query("CREATE INDEX target ON modlog (target)");
	await pool.query("CREATE INDEX blame ON modlog (blame)");
	console.log("Created ModLog Table");

	console.log("----------");

	const warningProps = {
		id: "CHAR(12) NOT NULL UNIQUE",
		guild_id: "VARCHAR(21) NOT NULL REFERENCES guilds(id)",
		user_id: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		blame_id: "VARCHAR(21) NOT NULL REFERENCES users(id)",
		warning_id: "TINYINT UNSIGNED NOT NULL",
		created_at: "BIGINT NOT NULL",
		reason: "TINYTEXT NULL"
	};

	console.log("Creating Warnings Table");
	await pool.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS warnings");
	await pool.query(`CREATE TABLE warnings (${Object.entries(warningProps).map(([a, b]) => `${a} ${b}`).join(", ")}, PRIMARY KEY (id))`);
	await pool.query("CREATE INDEX guild_id ON warnings (guild_id)");
	await pool.query("CREATE INDEX user_id ON warnings (user_id)");
	await pool.query("CREATE INDEX blame_id ON warnings (blame_id)");
	await pool.query("CREATE INDEX warning_id ON warnings (warning_id)");
	await pool.query("ALTER TABLE warnings ADD UNIQUE guild_user_wid (guild_id, user_id, warning_id)");
	console.log("Created Warnings Table");

	console.log("----------");

	process.exit(0);
});
