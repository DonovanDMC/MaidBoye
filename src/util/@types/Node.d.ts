interface JSON {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parse<T = any>(text: string, reviver?: (this: any, key: string, value: any) => any): T;
}
