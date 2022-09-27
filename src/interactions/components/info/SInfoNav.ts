import type { SectionNames } from "../../applicationCommands/info/sinfo.js";
import { generateSections } from "../../applicationCommands/info/sinfo.js";
import type MaidBoye from "../../../main.js";
import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import Util from "../../../util/Util.js";
import type { BaseState } from "../../../util/State.js";
import BaseComponent from "../structure/BaseComponent.js";

export default class SInfoComponent extends BaseComponent {
    action = "nav";
    command = "sinfo";

    override async handleGuild(interaction: ComponentInteraction<ValidLocation.GUILD>, data: BaseState & { section: SectionNames; }) {
        const sections = await generateSections.call(interaction.client as MaidBoye, interaction);
        return interaction.editParent(Util.replaceContent(sections[data.section]));
    }
}
