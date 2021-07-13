import Eris from "eris";

export default class ComponentHelper {
	static BUTTON_PRIMARY = 1 as const; // blurple
	static BUTTON_SUCCESS = 2 as const; // green
	static BUTTON_SECONDARY = 3 as const; // grey
	static BUTTON_DANGER = 4 as const; // red
	static BUTTON_LINK = 5 as const; // grey url
	private rows = [] as Array<Eris.ActionRow>;
	addRow(type: Eris.ActionRow["type"] = 1, components: Array<Eris.ActionRowComponents> = []) {
		this.rows.push({
			components,
			type
		});
		return this;
	}

	// https://discord.com/developers/docs/interactions/message-components#button-object-button-styles
	// 1 = blurple
	// 2 = grey
	// 3 = green
	// 4 = red
	// 5 = url
	addInteractionButton(style: 1 | 2 | 3 | 4, custom_id: string, disabled?: boolean, emoji?: Eris.ButtonBase["emoji"], label?: string) {
		//                                                             either up to 5 buttons or a select menu per row
		if (this.rows.length === 0 || this.rows[this.rows.length - 1].components.length >= 5 || this.rows[this.rows.length - 1].components[0]?.type === 3) this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: 2,
			style,
			custom_id,
			disabled,
			emoji,
			label
		});
		return this;
	}

	addURLButton(url: string, disabled?: boolean, emoji?: Eris.ButtonBase["emoji"], label?: string) {
		//                                                             either up to 5 buttons or a select menu per row
		if (this.rows.length === 0 || this.rows[this.rows.length - 1].components.length >= 5 || this.rows[this.rows.length - 1].components[0]?.type === 3) this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: 2,
			style: ComponentHelper.BUTTON_LINK,
			disabled,
			emoji,
			label,
			url
		});
		return this;
	}

	addSelectMenu(custom_id: string, options: Array<Eris.SelectMenuOptions>, placeholder?: string, min_values?: number, max_values?: number) {
		//                                                             either up to 5 buttons or a select menu per row
		if (this.rows.length === 0 || this.rows[this.rows.length - 1].components.length >= 5 || this.rows[this.rows.length - 1].components[0]?.type === 3) this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: 3,
			options,
			placeholder,
			min_values,
			max_values,
			custom_id
		});
		return this;
	}

	toJSON() { return this.rows; }

	static emojiToPartial(e: string, type: "default" | "custom"): Eris.ButtonBase["emoji"] {
		if (type === "default") return {
			id: null,
			name: e,
			animated: false
		};
		else {
			const [, anim, name, id] = /^<?(a)?:(.*):([\d]{15,21})>?$/.exec(e) ?? [];
			if (!name || !id) return this.emojiToPartial(e, "default");
			return {
				id,
				name,
				animated: anim === "a"
			};
		}
	}
}

export const InteractionCallbackType = {
	PONG: 1,
	CHANNEL_MESSAGE_WITH_SOURCE: 4,
	DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
	DEFERRED_UPDATE_MESSAGE: 6,
	UPDATE_MESSAGE: 7
};
