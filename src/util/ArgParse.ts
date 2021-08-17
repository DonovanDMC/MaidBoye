export default function ArgParse<T extends string>(str: string, argumentNames?: T[]) {
	return {
		command: str.split(" ")[0].slice(1),
		args: str.split(" ").slice(1),
		namedArgs: (argumentNames === undefined ? {} : str.split(" ").slice(1).filter((v, i) => argumentNames[i] !== undefined).map((v, i) => ({
			[argumentNames[i]]: v
		})).reduce((a, b) => ({ ...a, ...b }), {})) as Partial<Record<T, string>>
	};
}
