'use strict';

const deleteEmojis = require(__dirname+'/../../models/forms/deleteemojis.js')
, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {
	
	paramConverter: paramConverter({
		allowedArrays: ['checkedemojis'],
	}),
	
	controller: async (req, res, next) => {
		
		const { __ } = res.locals;
		
		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedemojis, 1), expected: false, error: __('Must select at least one emoji to delete') },
		]);
		
		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/assets.html`
			});
		}
		
		for (let i = 0; i < req.body.checkedemojis.length; i++) {
			if (!res.locals.board.emojis[req.body.checkedemojis[i]]) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': __('Bad request'),
					'message': __('Invalid emojis selected'),
					'redirect': `/${req.params.board}/manage/assets.html`
				});
			}
		}
		
		try {
			await deleteEmojis(req, res, next);
		} catch (err) {
			console.error(err);
			return next(err);
		}
		
	}
	
};
