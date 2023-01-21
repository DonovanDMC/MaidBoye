// lovingly borrowed from https://www.npmjs.com/package/@x-currency/xbase91
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~'";

export default class Base91 {
    static decode(data: string) {
        const raw = String(data);
        const len = raw.length;
        const res = [] as Array<string>;
        let b = 0;
        let n = 0;
        let v = -1;
        for (let i = 0; i < len; i++) {
            const p = alphabet.indexOf(raw[i]);
            if (p === -1) {
                continue;
            }
            if (v < 0) {
                v = p;
            } else {
                v += p * 91;
                b |= v << n;
                n += (v & 8191) > 88 ? 13 : 14;
                do {
                    res.push(String.fromCodePoint(b & 0xFF));
                    b >>= 8;
                    n -= 8;
                } while (n > 7);
                v = -1;
            }
        }

        if (v > -1) {
            res.push(String.fromCodePoint((b | v << n) & 0xFF));
        }
        return res.join("");
    }

    static encode(dataOrString: string) {
        const numbers = [] as Array<number>;
        let data = null;
        if (typeof dataOrString === "string") {
            for (let i = 0;i < dataOrString.length;i++) {
                numbers.push(dataOrString.codePointAt(i)!);
            }
            data = Uint8Array.from(numbers);
        } else {
            data = dataOrString; // u8 array
        }

        let res = "";
        let n = 0;
        let b = 0;
        for (const datum of data) {
            b |= datum << n;
            n += 8;
            if (n > 13) {
                let v = b & 8191;
                if (v > 88) {
                    b >>= 13;
                    n -= 13;
                } else {
                    v = b & 16383;
                    b >>= 14;
                    n -= 14;
                }
                res += alphabet[v % 91] + alphabet[Math.trunc(v / 91)];
            }
        }

        if (n) {
            res += alphabet[b % 91];
            if (n > 7 || b > 90) {
                res += alphabet[Math.trunc(b / 91)];
            }
        }

        return res;
    }
}
