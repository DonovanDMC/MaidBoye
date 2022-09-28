import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import { getPage } from "../../applicationCommands/misc/leaderboard.js";
import type MaidBoye from "../../../main.js";

export default class LeaderboardNavComponent extends BaseComponent {
    action = "nav";
    command = "leaderboard";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { page, type }: BaseState & { page: number; type: "server" | "global"; }) {
        const content = await getPage.call(interaction.client as MaidBoye, interaction, type, page);
        return interaction.editParent(content);
    }
}
