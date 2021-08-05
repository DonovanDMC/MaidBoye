ALTER TABLE strikes ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE strikes ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
ALTER TABLE strikes ADD FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
