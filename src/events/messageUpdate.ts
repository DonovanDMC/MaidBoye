import ClientEvent from "@util/ClientEvent";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("messageUpdate", async function(message, oldMessage) {
	if (oldMessage === null || message.content === oldMessage.content) return;
	await Redis.lpush(`snipe:edit:${message.channel.id}`, JSON.stringify({
		newContent: message.content,
		oldContent: oldMessage.content,
		author: message.author.id,
		time: Date.now()
	}));
	await Redis.ltrim(`snipe:edit:${message.channel.id}`, 0, 2);
});
