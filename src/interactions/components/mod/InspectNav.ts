import { mainMenu, modHistory, strikeHistory, warningHistory } from "../../applicationCommands/mod/inspect.js";
import type MaidBoye from "../../../main.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class InspectNavComponent extends BaseComponent {
    action = "nav";
    command = "inspect";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { page, section, target }: BaseState & { page: number; section: "home" | "strikes" | "mod" | "warnings"; target: string; }) {
        const client = interaction.client as MaidBoye;
        const user = await client.getUser(target);
        if (user === null) return interaction.editParent({ content: "H-hey! I couldn't find the user.." });

        switch (section) {
            case "strikes": return strikeHistory.call(client, interaction, user, page);
            case "mod": return modHistory.call(client, interaction, user, page);
            case "warnings": return warningHistory.call(client, interaction, user, page);
            case "home": return mainMenu.call(client, interaction, user);
        }
    }
}
