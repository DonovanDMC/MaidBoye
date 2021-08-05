ALTER TABLE timed ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE timed ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
