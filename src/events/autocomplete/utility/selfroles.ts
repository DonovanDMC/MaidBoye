import AutocompleteInteractionHandler from "../main";
import db from "@db";
import FuzzySearch from "fuzzy-search";

AutocompleteInteractionHandler
	.registerHandler("selfroles", ["join", "role"], async function handle(option, input, interaction) {
		const gConfig = await db.getGuild(interaction.member.guild.id);
		const res = gConfig.selfRoles.filter(r => !interaction.member.roles.includes(r.role)).map(r => ({
			name: interaction.member.guild.roles.get(r.role)?.name || `[Unknown] ${r.role}`,
			value: `<@&${r.role}>`
		}));
		if (gConfig.selfRoles.size === 0) return interaction.result([
			{
				name: "This server has no self assignable roles.",
				value: `autocomplete.none.${interaction.id}`
			}
		]);
		if (res.length === 0) return interaction.result([
			{
				name: "You've already got all the roles..",
				value: `autocomplete.all.${interaction.id}`
			}
		]);

		const search = new FuzzySearch(res, ["name"], {
			caseSensitive: false,
			sort: true
		});
		void interaction.result(search.search(String(input)));
	})
	.registerHandler("selfroles", ["leave", "role"], async function handle(option, input, interaction) {
		const gConfig = await db.getGuild(interaction.member.guild.id);
		if (gConfig.selfRoles.size === 0) return interaction.result([
			{
				name: "This server has no self assignable roles.",
				value: `autocomplete.none.${interaction.id}`
			}
		]);
		const uConfig = await db.getUser(interaction.member.id);
		const res = uConfig.selfRolesJoined.filter(r => interaction.member.roles.includes(r.role)).map(r => ({
			name: interaction.member.guild.roles.get(r.role)?.name || `[Unknown] ${r.role}`,
			value: `<@&${r.role}>`
		}));
		if (uConfig.selfRolesJoined.length === 0) return interaction.result([
			{
				name: "You haven't gained any roles via self roles..",
				value: `autocomplete.nojoin.${interaction.id}`
			}
		]);

		const search = new FuzzySearch(res, ["name"], {
			caseSensitive: false,
			sort: true
		});
		void interaction.result(search.search(String(input)));
	});
