import ComponentInteractionHandler from "../main";
import { generateSections } from "@commands/information/sinfo";

ComponentInteractionHandler
	.registerHandler("sinfo-members", false, async function handler(interaction) {
		const { members: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	})
	.registerHandler("sinfo-channels", false, async function handler(interaction) {
		const { channels: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	})
	.registerHandler("sinfo-icon", false, async function handler(interaction) {
		const { icon: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	})
	.registerHandler("sinfo-splash", false, async function handler(interaction) {
		const { splash: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	})
	.registerHandler("sinfo-banner", false, async function handler(interaction) {
		const { banner: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	})
	.registerHandler("sinfo-back", false, async function handler(interaction) {
		const { server: section } = await generateSections.call(this, interaction.channel.guild, interaction.member.user);
		return interaction.editParent(section);
	});
