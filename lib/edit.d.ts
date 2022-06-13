/// <reference types="node" />
import { Options } from './types';
export declare function edit(
	file: string,
	controller: NodeJS.ReadStream,
	output: NodeJS.WriteStream,
	options: Options
): Promise<void>;
