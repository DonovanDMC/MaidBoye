
import Route from "../Route";
import { apiKeys, emojis, botIcon } from "@config";
import type MaidBoye from "@MaidBoye";
import WebhookStore from "@util/WebhookStore";
import EmbedBuilder from "@util/EmbedBuilder";
import db from "@db";
import type { RawUserConfig } from "@models/User/UserConfig";
import UserConfig from "@models/User/UserConfig";

interface KoFiDonation {
	message_id: string;
	timestamp: string;
	type: "Donation" | "Subscription";
	is_public: boolean;
	from_name: string;
	message: string;
	amount: string;
	url: string;
	email: string;
	currency: string;
	is_subscription_payment: boolean;
	is_first_payment: boolean;
	kofi_transaction_id: string;
}

export default class DonateRoute extends Route {
	constructor(client: MaidBoye) {
		super("/donate");

		this.app
			.post("/ko-fi", async(req, res) => {
				if (req.query.code !== apiKeys["ko-fi"]) return res.status(401).end();
				const d = JSON.parse<KoFiDonation>((req.body as { data: string; }).data);
				const [user = null] = await db.query("SELECT * FROM users WHERE premium_kofi_email = ?", [d.email]) as Array<RawUserConfig>;
				if (user !== null) {
					await UserConfig.prototype.edit.call(user, {
						donations: {
							months: user.premium_months + 1,
							// only change it to true
							subscription: user.premium_subscription === false ? d.is_subscription_payment : undefined,
							total: user.premium_total + Number(d.amount)
						}
					});
					const dm = await client.getDMChannel(user.id);
					await dm.createMessage({
						embeds: [
							new EmbedBuilder()
								.setTitle("Thank You")
								.setDescription("Thank you for donating. If you have any issues, please contact a developer.")
								.setColor("gold")
								.toJSON()
						]
					});
				}
				void WebhookStore.execute("donations", {
					embeds: [
						new EmbedBuilder()
							.setTitle(`${d.type === "Donation" ? "One Time Donation" : d.is_first_payment ? `New Subscription ${emojis.default.tada}` : "Renewed Subscription"} | Amount: ${Number(d.amount)} ${d.currency}`)
							.setDescription(d.is_public ? d.message : "User Has Chosen To Keep Their Donation Private.")
							.setFooter(`Name: ${d.is_public ? d.from_name : "[Private]"}${user === null ? " | This Donation Is Unclaimed" : ""}`, botIcon)
							.toJSON()
					]
				}, false);

				return res.status(204).end();
			});
	}
}
