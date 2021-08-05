ALTER TABLE blacklist ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE blacklist ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
