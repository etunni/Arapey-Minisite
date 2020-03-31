module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		commonjs: true
	},
	globals: {
		process: true
	},
	plugins: ["compat", "prettier"],
	extends: ["eslint:recommended"],
	parserOptions: {
		sourceType: "module",
		ecmaFeatures: {
			modules: true,
			experimentalObjectRestSpread: true
		},
		ecmaVersion: 2017
	},
	rules: {
		"prettier/prettier": "error",
		"compat/compat": "error"
	}
};
