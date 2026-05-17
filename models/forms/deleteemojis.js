'use strict';

const { remove } = require('fs-extra')
, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
, { Boards } = require(__dirname+'/../../db/')
, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {
	
	const { __ } = res.locals;
	const redirect = `/${req.params.board}/manage/assets.html`;
	
	const updatedEmojis = res.locals.board.emojis;
	
	//delete file of all selected emojis
	await Promise.all(req.body.checkedemojis.map(async emojiName => {
		remove(`${uploadDirectory}/emoji/${req.params.board}/${res.locals.board.emojis[emojiName]}`);
		delete res.locals.board.emojis[emojiName];
	}));
	
	//remove from db
	await Boards.setEmojis(req.params.board, updatedEmojis);
	
	await remove(`${uploadDirectory}/html/${req.params.board}/thread/`);
	buildQueue.push({
		'task': 'buildBoardMultiple',
		'options': {
			'board': res.locals.board,
			'startpage': 1,
			'endpage': Math.ceil(res.locals.board.settings.threadLimit/10),
		}
	});
	buildQueue.push({
		'task': 'buildCatalog',
		'options': {
			'board': res.locals.board,
		}
	});
	
	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted emojis'),
		'redirect': redirect
	});
};
