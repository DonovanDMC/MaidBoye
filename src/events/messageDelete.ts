import ClientEvent from "@util/ClientEvent";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("messageDelete", async function(message) {
	if (!("guild" in message.channel) || !("content" in message)) return;
	await Redis.lpush(`snipe:edit:${message.channel.guild.id}`, JSON.stringify({
		content: message.content,
		author: message.author.id,
		time: Date.now(),
		ref: !message.referencedMessage ? null : {
			link: message.referencedMessage.jumpLink,
			author: message.referencedMessage.author.id,
			content: message.referencedMessage.content
		}
	}));
	await Redis.ltrim(`snipe:edit:${message.channel.guild.id}`, 0, 2);
});
