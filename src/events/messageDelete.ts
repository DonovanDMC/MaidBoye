import ClientEvent from "@util/ClientEvent";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("messageDelete", async function(message) {
	if (!("content" in message)) return;
	await Redis.lpush(`snipe:delete:${message.channel.id}`, JSON.stringify({
		content: message.content,
		author: message.author.id,
		time: Date.now(),
		ref: !message.referencedMessage ? null : {
			link: message.referencedMessage.jumpLink,
			author: message.referencedMessage.author.id,
			content: message.referencedMessage.content
		}
	}));
	await Redis.ltrim(`snipe:delete:${message.channel.id}`, 0, 2);
});
