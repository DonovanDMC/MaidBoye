import { LogEvents } from "../../../db/Models/LogEvent.js";
import type { ModalSubmitInteraction, ValidLocation } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import BaseModal from "../structure/BaseModal.js";
import RequestProxy from "../../../util/RequestProxy.js";
import Util from "../../../util/Util.js";
import { enableLogging } from "../../applicationCommands/util/logging.js";
import { MessageFlags } from "oceanic.js";
import { Strings } from "@uwu-codes/utils";

export default class LoggingWebhookModal extends BaseModal {
    action = "webhook";
    command = "logging";

    override async handleGuild(interaction: ModalSubmitInteraction<ValidLocation.GUILD>, components: Record<string, string | undefined>, { channel, event }: BaseState & { channel: string; event: LogEvents; }) {
        await interaction.defer(MessageFlags.EPHEMERAL);
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
                    content: `A pre-check failed when trying to fetch the image "${components.avatar}".\nA \`HEAD\` request returned a non 200 OK/204 No Content responses (${head.status} ${head.statusText})\n\nThis means we either can't access the file, the server is configured incorrectly, or the file does not exist.`
                });
            }

            const img = await RequestProxy.get(components.avatar);
            avatar = Buffer.from(await img.arrayBuffer());
        }

        const webhook = await interaction.client.rest.webhooks.create(channel, {
            name,
            avatar,
            reason: `Logging for ${Util.readableConstant(LogEvents[event])} (${interaction.user.tag})`
        });

        await enableLogging(interaction, channel, webhook, event);
    }
}
