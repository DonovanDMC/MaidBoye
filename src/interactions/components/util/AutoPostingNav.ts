import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";
import { autoPostingNav } from "../../applicationCommands/util/autoposting.js";

export default class AutoPostingNavComponent extends BaseComponent {
    action = "nav";
    command = "autoposting";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, { channel, dir, page }: BaseState & { channel: string | null; dir: -1 | 1; page: number; }) {
        if (dir === -1) {
            page--;
        } else {
            page++;
        }
        return autoPostingNav(interaction, page, channel);
    }
}
