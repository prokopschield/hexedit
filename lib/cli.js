#!/usr/bin/env node
'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
const argv_1 = __importDefault(require('@prokopschield/argv'));
const fs_1 = __importDefault(require('fs'));
const constants_1 = require('./constants');
const edit_1 = require('./edit');
function main() {
	const opts = argv_1.default
		.alias('mode', 'm')
		.alias('file', 'f')
		.alias('cols', 'coloumns', 'c', 'width', 'w')
		.alias('rows', 'r', 'height', 'h', 'lines', 'l')
		.alias('separator', 'sep', 's')
		.expect(['file', 'mode', 'cols', 'rows', 'separator'], {
			cols: String(constants_1.DEFAULT_COLS),
			rows: String(constants_1.DEFAULT_ROWS),
			separator: String(constants_1.DEFAULT_SEPARATOR),
		});
	const options = {
		readonly: !(opts.mode === 'write' || opts.mode === 'rw'),
		cols: Number(opts.cols) || constants_1.DEFAULT_COLS,
		rows: Number(opts.rows) || constants_1.DEFAULT_ROWS,
		sep: Number(opts.separator) || constants_1.DEFAULT_SEPARATOR,
	};
	const file = opts.file;
	if (!file || !fs_1.default.existsSync(file)) {
		console.error(`${file || '(file not specified)'} does not exist.`);
		return 1;
	}
	(0, edit_1.edit)(file, process.stdin, process.stdout, options);
}
main();
