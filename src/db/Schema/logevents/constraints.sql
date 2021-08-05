ALTER TABLE logevents ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
