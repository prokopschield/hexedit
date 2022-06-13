import { mmap } from '@prokopschield/mmap';
import prettify_buffer from 'pretty-print-buffer';
import { DEFAULT_SEPARATOR } from './constants';
import { Options } from './types';

const ansi = {
	interrupt: '\x03',
	terminate: '\x04',
	esc: '\x1b',
	up: '\x1b' + '[' + 'A',
	down: '\x1b' + '[' + 'B',
	right: '\x1b' + '[' + 'C',
	left: '\x1b' + '[' + 'D',
	cls: '\x1b' + '[' + 'J',
	cln: '\x1b' + '[' + 'K',
	goto: (row: number, col: number) => `\x1b[${row + 1};${col + 1}H`,
};

export async function edit(
	file: string,
	controller: NodeJS.ReadStream,
	output: NodeJS.WriteStream,
	options: Options
) {
	const sep = options.sep || DEFAULT_SEPARATOR;

	const mapping = mmap(file, options.readonly);

	controller.setRawMode(true);

	/** row, column */
	const position: [number, number] = [0, 0];

	/** row, column */
	let displayOffset = 0;

	const goto = (row: number, col: number) => {
		position[0] = row;
		position[1] = col;
		output.write(ansi.goto(row, col));
	};

	const render = () => {
		if (position[0] < 0) {
			displayOffset += position[0];
			if (displayOffset < 0) {
				displayOffset = 0;
			}
			position[0] = 0;
		}
		if (position[0] >= options.rows) {
			displayOffset += position[0] - options.rows + 1;
			position[0] = options.rows - 1;
		}

		const back: [number, number] = [...position];

		goto(0, 0);
		output.write(ansi.cls);

		for (let row = 0; row < options.rows; ++row) {
			const buf = mapping.slice(
				(displayOffset + row) * options.cols,
				(displayOffset + row) * options.cols + options.cols
			);

			if (!buf.length) {
				if (displayOffset) {
					--displayOffset;
					setTimeout(render);
				}
				break;
			}

			for (let col = 0; col < buf.length; ++col) {
				const slice = buf.slice(col, col + 1);

				goto(row, col * 3);
				output.write(slice.toString('hex'));
				goto(row, options.cols * 3 + sep + col * 2);
				output.write(prettify_buffer(slice));
			}
		}

		goto(...back);
	};

	const debug = (txt: string) => {
		const back: [number, number] = [...position];
		goto(options.rows, 0);
		output.write(ansi.cln + txt);
		goto(...back);
	};

	controller.on('data', (keystroke_raw) => {
		const keystroke = String(keystroke_raw);

		switch (keystroke) {
			case ansi.interrupt:
			case ansi.terminate:
				output.write(ansi.goto(0, 0) + ansi.cls);
				return process.exit(0);
			case 'W':
			case ansi.up:
				position[0]--;

				if (position[0] >= 0) {
					output.write(ansi.up);
				} else {
					setTimeout(render);
				}

				break;
			case 'S':
			case ansi.down:
				position[0]++;

				output.write(ansi.down);

				if (position[0] >= options.rows) {
					setTimeout(render);
				}

				break;
			case ansi.left:
				if (position[1]) {
					position[1]--;
					output.write(ansi.left);
				} else {
					position[0]--;
					position[1] = options.cols * 5 + sep - 1;
					output.write(ansi.goto(position[0], position[1]));
				}
				break;
			case ansi.right:
				if (position[1] < options.cols * 5 + sep - 1) {
					position[1]++;
					output.write(ansi.right);
				} else {
					position[0]++;
					position[1] = 0;
					output.write('\r\n');
				}
				break;
			case ansi.esc + '[5~':
				position[0] -= options.rows;
				render();
				break;
			case ansi.esc + '[6~':
				position[0] += options.rows;
				render();
				break;
			default:
				debug(`Received ${prettify_buffer(keystroke_raw)}`);
				break;
		}
	});

	render();
}
