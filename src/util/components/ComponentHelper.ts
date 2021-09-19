import Eris from "eris";

export default class ComponentHelper {
	static BUTTON_PRIMARY = 1 as const; // blurple
	static BUTTON_SECONDARY = 2 as const; // grey
	static BUTTON_SUCCESS = 3 as const; // green
	static BUTTON_DANGER = 4 as const; // red
	static BUTTON_LINK = 5 as const; // grey url
	private rows = [] as Array<Eris.ActionRow>;
	rowMax: 1 | 2 | 3 | 4 | 5;
	constructor(rowMax: ComponentHelper["rowMax"] = 5) { this.rowMax = rowMax; }
	addRow(type = Eris.Constants.ComponentTypes.ACTION_ROW, components: Array<Eris.ActionRowComponents> = []) {
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
		if (this.rows.length === 0 || this.rows[this.rows.length - 1].components.length >= this.rowMax || this.rows[this.rows.length - 1].components[0]?.type === 3) this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: Eris.Constants.ComponentTypes.BUTTON,
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
		if (this.rows.length === 0 || this.rows[this.rows.length - 1].components.length >= this.rowMax || this.rows[this.rows.length - 1].components[0]?.type === 3) this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: Eris.Constants.ComponentTypes.BUTTON,
			style: ComponentHelper.BUTTON_LINK,
			disabled,
			emoji,
			label,
			url
		});
		return this;
	}

	addSelectMenu(custom_id: string, options: Array<Eris.SelectMenuOptions>, placeholder?: string, min_values?: number, max_values?: number) {
		// select menus have to be on their own row
		this.addRow();
		this.rows[this.rows.length - 1].components.push({
			type: Eris.Constants.ComponentTypes.SELECT_MENU,
			options,
			placeholder,
			min_values,
			max_values,
			custom_id
		});
		return this;
	}

	removeEmptyRows() {
		this.rows.forEach((row, index) => {
			if (row.components.length === 0) this.rows.splice(index, 1);
		});

		return this;
	}

	toJSON() { return this.removeEmptyRows().rows; }

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
