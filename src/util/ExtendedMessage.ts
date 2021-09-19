
import Command from "./cmd/Command";
import CommandHandler from "./cmd/CommandHandler";
import BotFunctions from "./BotFunctions";
import GuildConfig from "../db/Models/Guild/GuildConfig";
import UserConfig from "../db/Models/User/UserConfig";
import MaidBoye from "../main";
import db from "../db";
import { defaultPrefix } from "@config";
import Eris, { Member, Message } from "eris";
import { parse } from "discord-command-parser";
import { Strings } from "@uwu-codes/utils";

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
		this.cmdInteracton = message.cmdInteracton;
		if (!this.client) this.client = client;
		// for interactions
		const self = this;
		// eslint-disable-next-line deprecation/deprecation
		this.channel.createMessage = async function createMessage(content: Eris.MessageContent, file?: Eris.FileContent | Array<Eris.FileContent> | undefined) {
			if (self.cmdInteracton !== null) {
				// interaction message isn't a real message
				if (typeof content !== "string" && content.messageReference) delete content.messageReference;
				return self.cmdInteracton.createFollowup({
					...(typeof content === "string" ? { content } : content),
					file
				}) as Promise<Eris.Message<Eris.TextChannel>>;
				// eslint-disable-next-line deprecation/deprecation
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
			...this.gConfig.prefix.map(({ value }) => value ?? defaultPrefix)
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
		if (this.cmd !== null) {
			const flags = Strings.parseFlags(this.args.join(" "), (name) => this.cmd!.parsedFlags.includes(name));
			this.dashedArgs.keyValue = flags.keyValue;
			this.dashedArgs.value = flags.value;
			this.args = flags.normalArgs;
		}

		return true;
	}
}
