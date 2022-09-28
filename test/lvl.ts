const levelingStartRate = 100;
const levelingFlatRate = 2000;
const levelingFlatRateStart = 20;

function calcExp(level: number) {
	const k = {
		level: level < levelingFlatRateStart ? level * levelingStartRate : levelingFlatRate,
		total: 0
	};
	if (level <= levelingFlatRateStart) for (let i = 0; i <= level; i++) k.total += i < levelingFlatRateStart ? i * 100 : levelingFlatRate;
	else {
		const { total: t } = calcExp(levelingFlatRateStart);
		k.total = t + (level - levelingFlatRateStart) * levelingFlatRate;
	}
	return k;
}

function calcLevel(xp: number) {
	let e = Number(xp), level = 0, complete = false;
	const { total: t } = calcExp(levelingFlatRateStart);
	if (xp <= t) {
		while (!complete) {
			const l = calcExp(level + 1).level;
			if (e >= l) {
				e -= l;
				level++;
			} else complete = true;
		}
	} else {
		// leftover exp after levelingFlatRateStart
		const l = xp - t;
		// leftover exp
		const a = l % levelingFlatRate;
		// levels above levelingFlatRateStart
		const b = Math.floor(l / levelingFlatRate);
		level = b + levelingFlatRateStart;
		e = a;
	}

	return {
		level,
		total:    xp,
		leftover: e,
		needed:   calcExp(level + 1).level - e
	};
}
