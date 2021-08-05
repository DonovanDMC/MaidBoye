ALTER TABLE levels ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE levels ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
