ALTER TABLE selfrolesjoined ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE selfrolesjoined ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
