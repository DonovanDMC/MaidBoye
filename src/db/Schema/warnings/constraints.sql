ALTER TABLE warnings ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE warnings ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
ALTER TABLE warnings ADD FOREIGN KEY (`blame_id`) REFERENCES `users` (`id`);
