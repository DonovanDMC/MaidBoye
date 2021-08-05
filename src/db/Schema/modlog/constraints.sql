ALTER TABLE modlog ADD FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`);
ALTER TABLE modlog ADD FOREIGN KEY (`strike_id`) REFERENCES `strikes` (`id`);
ALTER TABLE modlog ADD FOREIGN KEY (`timed_id`) REFERENCES `timed` (`id`);
