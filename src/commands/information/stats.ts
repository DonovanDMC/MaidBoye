import Command from "@cmd/Command";
import { emojis } from "@config";
import EmbedBuilder from "@util/EmbedBuilder";
import EventsASecondHandler from "@handlers/EventsASecondHandler";
import db from "@db";
import { Strings } from "@uwu-codes/utils";
import Timer from "@util/Timer";
const Redis = db.r;

export default new Command("stats")
	.setPermissions("bot", "embedLinks")
	.setDescription("Get some statistics about me")
	.setCooldown(3e3)
	.setExecutor(async function(msg) {

		const sql = await db.getStats();
		const sqlStart = Timer.getTime();
		await db.query("/* ping */ SELECT 1;");
		const sqlEnd = Timer.getTime();

		const r = await Redis.info("stats").then(v => v.split(/\n\r?/).slice(1, -1).map(s => ({
			[s.split(":")[0]]: Number(s.split(":")[1])
		})).reduce((a, b) => ({ ...a, ...b }), {})) as Record<
		"total_connections_received" | "total_commands_processed" | "instantaneous_ops_per_sec" |
		"total_net_input_bytes" | "total_net_output_bytes" | "instantaneous_input_kbps" |
		"instantaneous_output_kbps" | "rejected_connections" | "sync_full" |
		"sync_partial_ok" | "sync_partial_err" | "expired_keys" |
		"expired_stale_perc" | "expired_time_cap_reached_count" | "evicted_keys" |
		"keyspace_hits" | "keyspace_misses" | "pubsub_channels" |
		"pubsub_patterns" | "latest_fork_usec" | "migrate_cached_sockets" |
		"slave_expires_tracked_keys" | "active_defrag_hits" | "active_defrag_misses" |
		"active_defrag_key_hits" | "active_defrag_key_misses",
		number>;
		const redisStart = Timer.getTime();
		await Redis.ping();
		const redisEnd = Timer.getTime();

		const sec = EventsASecondHandler.get();

		return msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Stats")
					.addField("Events", await Promise.all(Object.entries(sec).filter(([key]) => !["GENERAL"].includes(key) && !key.startsWith("COMMANDS")).map(async([key, value]) => {
						const v = await Redis.get(`stats:events:${key}`);
						return `${emojis.default.dot} **${key}** ${value}/second (${(v ?? 0).toLocaleString("en-US")} total)`;
					})).then(v => v.join("\n")), false)
					.addField("MariaDB", sql === undefined ? "None" : [
						`Ping: **${Timer.calc(sqlStart, sqlEnd, 2, false)}**`,
						`Total Connections: **${sql.TOTAL_CONNECTIONS.toLocaleString("en-US")}**`,
						`Bytes Received: **${Strings.formatBytes(Number(sql.BYTES_RECEIVED))}**`,
						`Bytes Sent: **${Strings.formatBytes(Number(sql.BYTES_SENT))}**`,
						`Select Commands: **${sql.SELECT_COMMANDS.toLocaleString("en-US")}**`,
						`Update Commands: **${sql.UPDATE_COMMANDS.toLocaleString("en-US")}**`,
						`Other Commands: **${sql.OTHER_COMMANDS.toLocaleString("en-US")}**`,
						`Empty Queries: **${sql.EMPTY_QUERIES.toLocaleString("en-US")}**`
					].join("\n"), true)
					.addField("Redis", [
						`Ping: **${Timer.calc(redisStart, redisEnd, 2, false)}**`,
						`Connections: **${r.total_connections_received.toLocaleString("en-US")}**`,
						`Commands Processed: **${r.total_commands_processed.toLocaleString("en-US")}**`,
						`Operations: **${r.instantaneous_ops_per_sec.toLocaleString("en-US")}/second**`,
						`Net In: **${Strings.formatBytes(r.total_net_input_bytes)}**`,
						`Net Out: **${Strings.formatBytes(r.total_net_output_bytes)}**`
					].join("\n"), false)
					.toJSON()
			]
		});
	});
