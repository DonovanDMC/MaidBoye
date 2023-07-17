import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseModal from "../structure/BaseModal.js";
import RequestProxy from "../../../util/RequestProxy.js";
import { type Webhook } from "oceanic.js";
import { Strings } from "@uwu-codes/utils";
import { STATUS_CODES } from "node:http";

export default abstract class WebhookModal extends BaseModal {
    action = "webhook";

    abstract doAfter(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, webhook: Webhook, state: BaseState): Promise<void>;
    abstract getReason(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, state: BaseState): string;

    override async handleGuild(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, components: Record<string, string | undefined>, state: BaseState & Record<string, string>) {
        const name = components.name!;
        let avatar: Buffer | undefined;
        if (components.avatar) {
            if (!Strings.validateURL(components.avatar)) {
                return interaction.reply({
                    content: "H-hey! That wasn't a valid url.."
                });
            }
            const head = await RequestProxy.head(components.avatar);
            if (head.status !== 200 && head.status !== 204) {
                return interaction.reply({
                    content: `A pre-check failed when trying to fetch the image "${components.avatar}".\nA \`HEAD\` request returned a non 200 OK/204 No Content response (${head.status} ${STATUS_CODES[head.status] || "UNKNOWN"})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`
                });
            }

            const img = await RequestProxy.get(components.avatar);
            avatar = Buffer.from(await img.response.arrayBuffer());
        }

        const webhook = await interaction.client.rest.webhooks.create(state.channel, {
            name,
            avatar,
            reason: this.getReason(interaction, state)
        });

        return this.doAfter(interaction, webhook, state);
    }
}
