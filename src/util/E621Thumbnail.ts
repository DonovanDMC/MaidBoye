import type { E621ThumbnailType } from "../db/Models/UserConfig.js";
import Config from "../config/index.js";
import genThumbnail from "e621-thumbnailer";
import AWS from "aws-sdk";

const awsClient = new AWS.S3({
    endpoint:    Config.thumbsEndpoint,
    region:      Config.thumbsRegion,
    credentials: new AWS.Credentials({
        accessKeyId:     Config.s3Accesskey,
        secretAccessKey: Config.s3SecretKey
    }),
    s3BucketEndpoint: true
});
export default class E621Thumbnail {
    // so we don't override if we've already navigated away
    private static pendingList: Array<[string, number]> = [];
    static addPending(message: string, post: number) {
        if (this.hasPending(message, post)) {
            return false;
        } else {
            // remove pending for any other post ids
            if (this.hasPending(message)) {
                this.removePending(message);
            }
            this.pendingList.push([message, post]);
            return true;
        }
    }

    static async create(url: string, md5: string, type: Exclude<E621ThumbnailType, "none">) {
        const name = `${md5}.${type === "image" ? "png" : "gif"}`;
        const prev = await awsClient.getObject({
            Bucket: Config.thumbsBucket,
            Key:    name
        }).promise().then(() => true, () => false);
        console.log(url, md5, type, prev);
        if (prev) {
            return `${Config.thumbsURL}/${name}`;
        }
        const thumb = await genThumbnail(url, type, {
            gifLength:            1,
            gifOptimizationLevel: 3
        });

        await awsClient.putObject({
            Bucket:      Config.thumbsBucket,
            Key:         name,
            Body:        thumb,
            ContentType: type === "image" ? "image/png" : "image/gif"
        }).promise();
        return `${Config.thumbsURL}/${name}`;
    }

    static hasPending(message: string, post?: number) {
        return this.pendingList.some(p => p[0] === message && (!post || p[1] === post)) !== undefined;
    }

    static removePending(message: string) {
        if (this.hasPending(message)) {
            const p = this.pendingList.filter(l => l[0] === message);
            for (const l of p) {
                this.pendingList.splice(this.pendingList.indexOf(l), 1);
            }
            return p.length !== 0;
        } else {
            return false;
        }
    }
}
