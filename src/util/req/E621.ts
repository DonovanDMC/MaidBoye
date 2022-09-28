import Config from "../../config/index.js";
import type { Post } from "e621";
import E6 from "e621";
const E621 = new E6({
    authUser:  Config.e621User,
    authKey:   Config.e621APIKey,
    userAgent: Config.userAgent
});
export const filterPosts = (posts: Array<Post>, noVideo: boolean, noFlash: boolean) => posts.filter(p => !Object.values(p.tags).reduce((a, b) => a.concat(b)).find(t => ["cub", "young"].includes(t)) || (noVideo && p.file.ext === "webm") || (noFlash && p.file.ext === "swf"));
export default E621;
