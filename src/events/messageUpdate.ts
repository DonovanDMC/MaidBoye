import ClientEvent from "@util/ClientEvent";
import db from "@db";
const Redis = db.r;

export default new ClientEvent("messageUpdate", async function(message, oldMessage) {
	if (oldMessage === null || !("guild" in message.channel) || message.content === oldMessage.content) return;
	await Redis.lpush(`snipe:edit:${message.channel.guild.id}`, JSON.stringify({
		newContent: message.content,
		oldContent: oldMessage.content,
		author: message.author.id,
		time: Date.now()
	}));
	await Redis.ltrim(`snipe:edit:${message.channel.guild.id}`, 0, 2);
});
