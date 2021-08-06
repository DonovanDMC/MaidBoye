function hex2bin(hex: string) {
	const buf = new Uint8Array(Math.ceil(hex.length / 2));
	for (let i = 0; i < buf.length; i++) buf[i] = parseInt(hex.substr(i * 2, 2), 16);
	return buf;
}

const publicKey = crypto.subtle.importKey(
	"raw",
	hex2bin(PUBLIC_KEY),
	{
		name: "NODE-ED25519",
		namedCurve: "NODE-ED25519",
	},
	true,
	["verify"],
);

const encoder = new TextEncoder();

export async function verify(request: Request): Promise<boolean> {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const signature = hex2bin(request.headers.get("X-Signature-Ed25519")!);
	const timestamp = request.headers.get("X-Signature-Timestamp");
	const unknown = await request.clone().text();

	return await crypto.subtle.verify(
		"NODE-ED25519",
		await publicKey,
		signature,
		encoder.encode(timestamp + unknown),
	);
}
