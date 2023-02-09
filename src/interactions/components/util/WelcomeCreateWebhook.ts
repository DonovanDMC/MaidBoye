import type { ComponentInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import CreateWebhookComponent from "../structure/CreateWebhook.js";

export default abstract class WelcomeCreateWebhookComponent extends CreateWebhookComponent {
    command = "welcome";

    protected override getAvatar(interaction: ComponentInteraction<ValidLocation.GUILD>): string {
        return interaction.guild.iconURL("png") ?? super.getAvatar(interaction);
    }

    protected override getName(interaction: ComponentInteraction<ValidLocation.GUILD>) {
        return interaction.guild.name || super.getName(interaction);
    }
}
