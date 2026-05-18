'use strict';

const addEmojis = require(__dirname+'/../../models/forms/addemojis.js')
, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
, config = require(__dirname+'/../../lib/misc/config.js')
, { checkSchema, numberBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {
	
	//paramConverter: paramConverter({}),
	
	controller: async (req, res, next) => {
		
		const { __ } = res.locals;
		
		const { globalLimits, disableAnonymizerFilePosting } = config.get;
		
		const errors = await checkSchema([
			{ result: res.locals.numFiles === 0, expected: false, blocking: true, error: __('Must provide a file') },
			{ result: (res.locals.anonymizer && disableAnonymizerFilePosting && !res.locals.permissions.get(Permissions.BYPASS_ANONYMIZER_RESTRICTIONS)), expected: false, error: __('Posting files through anonymizers has been disabled globally') },
			{ result: numberBody(res.locals.numFiles, 0, globalLimits.emojiFiles.max), expected: true, error: __('Exceeded max emoji uploads in one request of %s', globalLimits.emojiFiles.max) },
			{ result: numberBody(Object.keys(res.locals.board.emojis).length+res.locals.numFiles, 0, globalLimits.emojiFiles.total), expected: true, error: __('Total number of emojis would exceed global limit of %s', globalLimits.emojiFiles.total) },
		]);
		
		if (errors.length > 0) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}
		
		try {
			await addEmojis(req, res, next);
		} catch (err) {
			await deleteTempFiles(req).catch(console.error);
			return next(err);
		}
		
	}
	
};
