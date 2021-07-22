
import Command from "./cmd/Command";
import CommandHandler from "./cmd/CommandHandler";
import BotFunctions from "./BotFunctions";
import GuildConfig from "../db/Models/Guild/GuildConfig";
import UserConfig from "../db/Models/User/UserConfig";
import MaidBoye from "../main";
import db from "../db";
import config from "@config";
import Eris, { Member, Message } from "eris";
import { parse } from "discord-command-parser";

export default class ExtendedMessage extends Message<Eris.GuildTextableChannel> {
	gConfig: GuildConfig;
	uConfig: UserConfig;
	declare prefix: string;
	cmd: Command | null;
	args: Array<string>;
	rawArgs: Array<string>;
	dashedArgs = {
		keyValue: {} as Record<string, string>,
		value: [] as Array<string>
	};
	client: MaidBoye;
	// make not null
	declare member: Member;
	constructor(message: Message, client: MaidBoye) {
		super(BotFunctions.messageToOriginal(message), client);
		if (!this.client) this.client = client;
		// for interactions
		const self = this;
		this.channel.createMessage = async function createMessage(content: Eris.MessageContent, file?: Eris.MessageFile | Array<Eris.MessageFile> | undefined) {
			if (typeof content === "string") content = { content };
			if (self.isInteraction === true && (self.interactionId !== null && self.interactionToken !== null)) {
				if (self.firstReply === true) return this.client.createFollowupMessage(this.client.user.id, self.interactionToken, content);
				else {
					self.firstReply = true;
					return this.client.createInteractionResponse(self.interactionId, self.interactionToken, 5, content);
				}
			} else return self.client.createMessage.call(self.client, this.id, content, file) as Promise<Eris.Message<Eris.TextChannel>>;
		};
	}

	async load() {
		this.gConfig = await db.getGuild(this.channel.guild.id);
		await this.gConfig.fix();
		this.uConfig = await db.getUser(this.author.id);
		await this.uConfig.fix();

		const p = parse(this, [
			`<@${this.client.user.id}>`,
			`<@!${this.client.user.id}>`,
			...this.gConfig.prefix.map(({ value }) => value ?? config.defaults.prefix)
		], {
			allowSpaceBeforeCommand: true,
			ignorePrefixCase: true
		});
		// console.log(p);

		if (p.success === false) return false;

		this.args = p.arguments;
		this.rawArgs = p.body.split(" ");
		this.prefix = p.prefix;
		// if the used prefix was a mention, replace it with the server's first prefix
		if (this.prefix.replace(/!/g, "") === `<@${this.client.user.id}`) this.prefix = this.gConfig.prefix[0].value;
		this.cmd = CommandHandler.getCommand(p.command);
		if (this.cmd !== null) Array.from(this.args).forEach(arg => {
			if (/^(-[a-z]|--[a-z]+(=.+)?)$/.test(arg)) {
				const [, name] = /^--?([a-z\d]+)(?:=.*)?$/.exec(arg) ?? [];
				if (!name || !this.cmd!.parsedFlags.includes(name)) return;
				const indexArg = this.args.indexOf(arg);
				const indexArgRaw = this.rawArgs.indexOf(arg);
				// make sure we don't remove the last arg if what we're looking for isn't present
				if (indexArg !== -1) this.args.splice(this.args.indexOf(arg), 1);
				if (indexArgRaw !== -1) this.rawArgs.splice(indexArgRaw, 1);
				// short arg, ex -d
				if (arg.length === 2) return this.dashedArgs.value.push(arg.slice(1));
				// long arg, e --key or --key=value
				else if (arg.startsWith("--")) {
					const [k, v] = arg.slice(2).split("=");
					if (!v) this.dashedArgs.value.push(k);
					else this.dashedArgs.keyValue[k] = v;
				}
			} else return;
		});

		return true;
	}
}
