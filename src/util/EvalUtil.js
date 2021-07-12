/* eslint-disable */
// this external functions is used for evals as typescript screws with the context and variables
// this is also the reason this file is plain javascript, and not typescript

/**
 * @param {string} code - code to evaluate
 * @param {Record<string, any>} variables - variables for use in evaluation
 * @returns {Promise<unknown>}
 */
module.exports = async function EvalUtil(code, variables) {
	for (const k in variables)
		if (Object.prototype.hasOwnProperty.call(variables, k))
			new Function("value", ` ${k} = value `)(v[k]);

	return eval(code);
};
