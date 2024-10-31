#!/usr/bin/env node

import debugLib from 'debug';

import command from '../lib/cli/command';
import * as exit from '../lib/cli/exit';
import { searchAndReplace } from '../lib/search-and-replace';

const debug = debugLib( '@automattic/vip:bin:vip-search-replace' );

// Command examples
const examples = [
	// `search-replace` flag
	{
		usage: 'vip search-replace file.sql --search-replace="from,to"',
		description:
			'Search for every instance of the value "from" in the local input file named "file.sql" and replace it with the value "to".\n' +
			'       * Results of the operation output to STDOUT by default.',
	},
	// `in-place` flag
	{
		usage: 'vip search-replace file.sql --search-replace="from,to" --in-place',
		description:
			'Perform the search and replace operation and save the results to the local input file "file.sql".',
	},
	// `output` flag
	{
		usage: 'vip search-replace file.sql --search-replace="from,to" --output=output-file.sql',
		description:
			'Perform the search and replace operation and save the results to a local clone of the input file named "output-file.sql".',
	},
];

command( {
	requiredArgs: 1,
} )
	.option(
		'search-replace',
		'Pass a string value to search for and a string value to replace it with. Separate the values by a comma only; no spaces (e.g. --search-replace=“from,to”).'
	)
	.option(
		'in-place',
		'Save the results of a search and replace operation to the local input file.'
	)
	.option(
		'output',
		'Save the results of the search and replace operation to a clone of the local input file. Ignored if the command includes --in-place. Accepts a local file path.'
	)
	.examples( examples )
	.argv( process.argv, async ( arg, opt ) => {
		// TODO: tracks event for usage of this command stand alone
		const { searchReplace, inPlace, output } = opt;

		debug( 'Args: ', arg, 'searchReplace: ', searchReplace );

		const filename = arg[ 0 ];
		if ( ! arg && ! filename ) {
			exit.withError( 'You must pass in a filename' );
		}

		if ( ! searchReplace || ! searchReplace.length ) {
			exit.withError(
				'You must provide a pair of strings (separated by comma) such as original,replacement'
			);
		}

		const isImport = false;
		await searchAndReplace( filename, searchReplace, { isImport, inPlace, output } );
	} );
