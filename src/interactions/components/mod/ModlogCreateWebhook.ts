import CreateWebhookComponent from "../structure/CreateWebhook.js";

export default abstract class ModlogCreateWebhookComponent extends CreateWebhookComponent {
    command = "modlog";

    protected override getName() {
        return "Maid Boye ModLog";
    }
}
