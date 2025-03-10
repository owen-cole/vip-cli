import * as enquirer from 'enquirer';
import path from 'path';

import { validateAndGetTableNames, gates, promptToContinue } from '../../src/bin/vip-import-sql';
import * as exit from '../../src/lib/cli/exit';

jest.mock( '../../src/lib/tracker' );
jest.mock( '../../src/lib/validations/site-type' );
jest.mock( '../../src/lib/validations/is-multi-site' );
jest.mock( '../../src/lib/api/feature-flags' );
jest.spyOn( process, 'exit' ).mockImplementation( () => {} );
jest.spyOn( console, 'log' ).mockImplementation( () => {} );

jest.mock( 'enquirer', () => ( {
	prompt: jest.fn(),
} ) );

const mockExitWithError = jest.spyOn( exit, 'withError' );

describe( 'vip-import-sql', () => {
	describe( 'validateAndGetTableNames', () => {
		it( 'returns an empty array when skipValidate is true', async () => {
			const params = {
				skipValidate: true,
				appId: 1,
				envId: 1,
				fileNameToUpload: '__fixtures__/client-file-uploader/db-dump-ipsum-67mb.sql',
			};
			const result = await validateAndGetTableNames( params );
			expect( result ).toEqual( [] );
		} );
		it( 'returns an array of table names that are contained within the input file', async () => {
			const params = {
				skipValidate: false,
				appId: 1,
				envId: 1,
				fileNameToUpload: '__fixtures__/client-file-uploader/db-dump-ipsum-67mb.sql',
			};
			const result = await validateAndGetTableNames( params );
			const expected = [
				'wp_commentmeta',
				'wp_comments',
				'wp_links',
				'wp_options',
				'wp_postmeta',
				'wp_posts',
				'wp_term_relationships',
				'wp_term_taxonomy',
				'wp_termmeta',
				'wp_terms',
				'wp_usermeta',
				'wp_users',
			];
			expect( result ).toEqual( expected );
		} );
	} );

	describe( 'gates', () => {
		const opts = {
			app: {
				id: 1,
				typeId: 2,
				organization: {
					id: 2,
				},
			},
			env: {
				id: 1,
				type: 'develop',
				importStatus: {
					dbOperationInProgress: false,
					importInProgress: false,
				},
			},
		};

		beforeEach( async () => {
			mockExitWithError.mockClear();
		} );

		it( 'fails if the import file has an invalid extension', async () => {
			const invalidFilePath = path.join(
				process.cwd(),
				'__fixtures__',
				'validations',
				'empty.zip'
			);

			const fileMeta = { fileName: invalidFilePath, basename: 'empty.zip' };
			await gates( opts.app, opts.env, fileMeta );
			expect( mockExitWithError ).toHaveBeenCalledWith(
				'Invalid file extension. Please provide a .sql or .gz file.'
			);
		} );

		it.each( [ 'bad-sql-dump.sql.gz', 'bad-sql-dump.sql' ] )(
			'passes if the import file has a valid extension',
			async basename => {
				const validFilePath = path.join( process.cwd(), '__fixtures__', 'validations', basename );
				const fileMeta = { fileName: validFilePath, basename };
				await gates( opts.app, opts.env, fileMeta );
				expect( mockExitWithError ).not.toHaveBeenCalled();
			}
		);
	} );

	describe( 'promptToContinue', () => {
		beforeEach( async () => {
			mockExitWithError.mockClear();
		} );

		it( 'does not exit with error upon correct input (exact case match)', async () => {
			const domain = 'example.com';
			const promptMock = jest
				.spyOn( enquirer, 'prompt' )
				.mockResolvedValueOnce( { confirmedDomain: domain.toUpperCase() } );

			await promptToContinue( {
				launched: true,
				formattedEnvironment: 'development',
				track: jest.fn(),
				domain,
			} );

			expect( promptMock ).toHaveBeenCalled();
			expect( mockExitWithError ).not.toHaveBeenCalledWith( expect.any( String ) );

			promptMock.mockRestore();
		} );

		it( 'does not exit with error upon correct input (different case match)', async () => {
			const domain = 'example.com';
			const promptMock = jest
				.spyOn( enquirer, 'prompt' )
				.mockResolvedValueOnce( { confirmedDomain: domain.toLowerCase() } );

			await promptToContinue( {
				launched: true,
				formattedEnvironment: 'development',
				track: jest.fn(),
				domain,
			} );

			expect( promptMock ).toHaveBeenCalled();
			expect( mockExitWithError ).not.toHaveBeenCalledWith( expect.any( String ) );

			promptMock.mockRestore();
		} );

		it( 'exits with error upon incorrect input', async () => {
			const domain = 'example.com';
			const promptMock = jest
				.spyOn( enquirer, 'prompt' )
				.mockResolvedValueOnce( { confirmedDomain: 'WRONG_INPUT' } );

			await promptToContinue( {
				launched: true,
				formattedEnvironment: 'development',
				track: jest.fn(),
				domain,
			} );

			expect( promptMock ).toHaveBeenCalled();
			expect( mockExitWithError ).toHaveBeenCalledWith( expect.any( String ) );

			promptMock.mockRestore();
		} );
	} );
} );
