ALTER TABLE tags ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
