import BaseComponent from "../structure/BaseComponent.js";
import type { ComponentInteraction } from "../../../util/cmd/Command.js";
import type { BaseState } from "../../../util/State.js";
import E621TagsState from "../E621TagsState.js";
import E621, { filterPosts } from "../../../util/req/E621.js";
import UserConfig from "../../../db/Models/UserConfig.js";
import { makeMessage, orders } from "../../applicationCommands/nsfw/e621.js";
import Logger from "../../../util/Logger.js";
import { type Post } from "e621";

export default class E621Component extends BaseComponent {
    action = "nav";
    command = "e621";

    protected override async handle(interaction: ComponentInteraction, data: BaseState & { dir: -2 | -1 | 1 | 2; index: number; order: number; tags: string; }) {
        const tags = await E621TagsState.get(data.tags);
        if (tags === null) {
            throw new Error(`Failed to retrieve tags for e621-nav (${JSON.stringify(data)})`);
        }
        if (!tags.some(t => t.startsWith("order:"))) {
            tags.push(`order:${orders[data.order]}`);
        }
        let q: Array<Post>;
        try {
            q = await E621.posts.search({ tags, limit: 100 });
        } catch (err) {
            Logger.getLogger("Components[e621]").error(err);
            if (!interaction.acknowledged) {
                await interaction.defer();
            }
            await interaction.createFollowup({
                content: "An error occurred while searching e621. Please try again later. You can also check <https://status.e621.ws> to see if e621 is down."
            });
            return;
        }
        const uConfig = await UserConfig.get(interaction.user.id);
        const posts = filterPosts(q, uConfig.preferences.e621NoVideo, uConfig.preferences.e621NoFlash);
        let index = data.index;
        switch (data.dir) {
            case -2: {
                index = 0;
                break;
            }
            case -1: {
                index--;
                break;
            }
            case 1: {
                index++;
                break;
            }
            case 2: {
                index = posts.length - 1;
                break;
            }
        }
        if (index < 0) {
            index = posts.length - 1;
        }
        if (index > (posts.length - 1)) {
            index = 0;
        }
        void makeMessage(interaction, data.order, index, posts, data.tags, uConfig.preferences.e621ThumbnailType);
    }
}
