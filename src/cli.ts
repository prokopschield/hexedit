#!/usr/bin/env node

import argv from '@prokopschield/argv';
import fs from 'fs';

import { DEFAULT_ROWS, DEFAULT_SEPARATOR, DEFAULT_COLS } from './constants';
import { edit } from './edit';
import { Options } from './types';

function main() {
	const opts = argv
		.alias('mode', 'm')
		.alias('file', 'f')
		.alias('cols', 'coloumns', 'c', 'width', 'w')
		.alias('rows', 'r', 'height', 'h', 'lines', 'l')
		.alias('separator', 'sep', 's')
		.expect(['file', 'mode', 'cols', 'rows', 'separator'], {
			cols: String(DEFAULT_COLS),
			rows: String(DEFAULT_ROWS),
			separator: String(DEFAULT_SEPARATOR),
		});

	const options: Options = {
		readonly: !(opts.mode === 'write' || opts.mode === 'rw'),
		cols: Number(opts.cols) || DEFAULT_COLS,
		rows: Number(opts.rows) || DEFAULT_ROWS,
		sep: Number(opts.separator) || DEFAULT_SEPARATOR,
	};

	const file = opts.file;

	if (!file || !fs.existsSync(file)) {
		console.error(`${file || '(file not specified)'} does not exist.`);
		return 1;
	}

	edit(file, process.stdin, process.stdout, options);
}

main();
