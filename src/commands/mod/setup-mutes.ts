import Command from "@cmd/Command";
import Eris from "eris";
import EmbedBuilder from "@util/EmbedBuilder";
import ComponentHelper from "@util/ComponentHelper";
import Logger from "@util/Logger";

export default new Command("setup-mutes")
	.setPermissions("bot", "embedLinks", "manageChannels")
	.setPermissions("user", "manageChannels")
	.setDescription("setup the proper mute permissions")
	.setCooldown(3e3)
	.setParsedFlags("undo")
	.setExecutor(async function(msg) {
		if (msg.gConfig.settings.muteRole === null) return msg.reply(`Th-this server's mute role hasn't been set up.. Try \`${msg.gConfig.getFormattedPrefix()}settings\``);
		const r = msg.channel.guild.roles.get(msg.gConfig.settings.muteRole);
		if (!r) {
			await msg.gConfig.edit({
				settings: {
					muteRole: null
				}
			});
			return msg.reply("Th-this server's mute role is invalid..");
		}

		const permsText = {} as Record<string, Record<string, [allow: bigint, deny: bigint]>>;
		const permsVoice = {} as Record<string, Record<string, [allow: bigint, deny: bigint]>>;

		msg.channel.guild.channels.forEach(ch => {
			const everyone = ch.permissionOverwrites.get(msg.channel.guild.id);
			const role = ch.permissionOverwrites.get(msg.gConfig.settings.muteRole!);
			const t = {} as Record<string, [allow: bigint, deny: bigint]>;
			const v = {} as Record<string, [allow: bigint, deny: bigint]>;
			// text
			if (ch.type === Eris.Constants.ChannelTypes.GUILD_TEXT || ch.type === Eris.Constants.ChannelTypes.GUILD_NEWS) {
				if (everyone && everyone.allow & Eris.Constants.Permissions.sendMessages) t[everyone.id] = [everyone.allow - Eris.Constants.Permissions.sendMessages, everyone.deny];
				if (role && role.allow & Eris.Constants.Permissions.sendMessages) t[role.id] = [role.allow - Eris.Constants.Permissions.sendMessages, role.deny];
				if (role && !(role.deny & Eris.Constants.Permissions.sendMessages)) t[role.id] = [!t[role.id] ? role.allow : t[role.id][0], role.deny | Eris.Constants.Permissions.sendMessages];
				if (!role || role?.deny === 0n) t[msg.gConfig.settings.muteRole!] = [!t[msg.gConfig.settings.muteRole!] ? 0n : t[msg.gConfig.settings.muteRole!][0], Eris.Constants.Permissions.sendMessages];
				if (Object.keys(t).length !== 0) permsText[ch.id] = t;
			// voice
			} else if (ch.type === Eris.Constants.ChannelTypes.GUILD_VOICE) {
				if (everyone && everyone.allow & Eris.Constants.Permissions.voiceSpeak) v[everyone.id] = [everyone.allow - Eris.Constants.Permissions.voiceSpeak, everyone.deny];
				if (role && role.allow & Eris.Constants.Permissions.voiceSpeak) v[role.id] = [role.allow - Eris.Constants.Permissions.voiceSpeak, role.deny];
				if (role && !(role.deny & Eris.Constants.Permissions.voiceSpeak)) v[role.id] = [!v[role.id] ? role.allow : v[role.id][0], role.deny | Eris.Constants.Permissions.voiceSpeak];
				if (!role || role?.deny === 0n) v[msg.gConfig.settings.muteRole!] = [!v[msg.gConfig.settings.muteRole!] ? 0n : v[msg.gConfig.settings.muteRole!][0], Eris.Constants.Permissions.voiceSpeak];
				if (Object.keys(v).length !== 0) permsVoice[ch.id] = v;
			} else return;
		});

		if (Object.keys(permsText).length === 0 && Object.keys(permsVoice).length === 0) return msg.reply("Mutes seem to already be set up?");

		const m = await msg.reply({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Confirm Edits")
					.setDescription(`Are you sure you want to edit **${Object.keys(permsText).length}** text channel${Object.keys(permsText).length !== 1 ? "s" : ""} and **${Object.keys(permsVoice).length}** voice channel${Object.keys(permsVoice).length !== 1 ? "s" : ""}?`)
					.toJSON()
			],
			components: new ComponentHelper()
				.addInteractionButton(ComponentHelper.BUTTON_SECONDARY, `confirmmutes-yes.${msg.author.id}`, false, undefined, "Yes")
				.addInteractionButton(ComponentHelper.BUTTON_DANGER, `confirmmutes-no.${msg.author.id}`, false, undefined, "No")
				.toJSON()
		});
		const w = await msg.channel.awaitComponentInteractions(3e4, (it) => it.data.custom_id.startsWith("confirmmutes-") && it.member.user.id === msg.author.id && it.message.id === m.id);
		if (w === null) return m.edit({
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Edits Cancelled")
					.setColor("red")
					.setDescription("Timeout detected, cancelling.")
					.toJSON()
			],
			components: []
		});
		if (w.data.custom_id.includes("no")) return this.createInteractionResponse(w.id, w.token, Eris.Constants.InteractionResponseTypes.UPDATE_MESSAGE, {
			embeds: [
				new EmbedBuilder(true, msg.author)
					.setTitle("Edits Cancelled")
					.setColor("red")
					.setDescription("Cancelled.")
					.toJSON()
			],
			components: []
		});
		await  this.createInteractionResponse(w.id, w.token, Eris.Constants.InteractionResponseTypes.UPDATE_MESSAGE, {
			content: "Processing..",
			embeds: [],
			components: []
		});
		await msg.channel.sendTyping();
		const t = setInterval(() => msg.channel.sendTyping(), 7e3);
		let errorCount = 0;
		try {
			await Promise.all([...Object.entries(permsText), ...Object.entries(permsVoice)].map(async([channelId, p]) => {
				const k = Object.entries(p);
				for (const [id, [allow, deny]] of k) {
					const ch = msg.channel.guild.channels.get(channelId);
					if (ch === undefined) {
						errorCount++;
						continue;
					}
					await ch.editPermission(id, allow, deny, 0, `Setup-Mutes: ${msg.author.tag} (${msg.author.id})`).catch((err) => {
						Logger.getLogger("SetupMutesCommand").error(err);
						errorCount++;
					});
				}
			}));
		} catch (e) {
			clearInterval(t);
			throw e;
		}
		clearInterval(t);
		await m.edit(`Completed with **${errorCount}** error${errorCount !== 1 ? "s" : ""}.`);
	});
