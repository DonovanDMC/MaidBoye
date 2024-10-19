declare namespace FemboyFans {
    export interface Post {
        approver_id:     number | null;
        change_seq:      number;
        comment_count:   number;
        created_at:      string;
        crop:            Crop;
        description:     string;
        duration:        null;
        fav_count:       number;
        file:            File;
        flags:           Flags;
        framecount:      null;
        has_notes:       boolean;
        id:              number;
        is_favorited:    boolean;
        locked_tags:     Array<string>;
        own_vote:        number;
        pools:           Array<number>;
        preview:         Crop;
        qtags:           Array<string>;
        rating:          string;
        relationships:   Relationships;
        sample:          Crop;
        score:           Score;
        sources:         Array<string>;
        tags:            Tags;
        thumbnail_frame: null;
        updated_at:      string;
        upload_url:      string | null;
        uploader_id:     number;
        views:           Views;
    }

    export interface Crop {
        alternates?: Alternates;
        has?:        boolean;
        height:      number;
        url:         string;
        width:       number;
    }

    export interface Alternates {
        "480p"?: Alternate;
        "720p"?: Alternate;
        "original": Alternate;
    }

    export interface Alternate {
        height: number;
        type: "video";
        urls: [webm: string | null, mp4: string | null];
        width: number;
    }

    export interface File {
        ext:    string;
        height: number;
        md5:    string;
        size:   number;
        url:    string;
        width:  number;
    }

    export interface Flags {
        deleted:       boolean;
        flagged:       boolean;
        note_locked:   boolean;
        pending:       boolean;
        rating_locked: boolean;
        status_locked: boolean;
    }

    export interface Relationships {
        children:            Array<number>;
        has_active_children: boolean;
        has_children:        boolean;
        parent_id:           number | null;
    }

    export interface Score {
        down:  number;
        total: number;
        up:    number;
    }

    export interface Tags {
        artist:      Array<string>;
        character:   Array<string>;
        copyright:   Array<string>;
        gender:      Array<string>;
        general:     Array<string>;
        invalid:     Array<string>;
        lore:        Array<string>;
        meta:        Array<string>;
        species:     Array<string>;
        voice_actor: Array<string>;
    }

    export interface Views {
        daily: number;
        total: number;
    }

}
