'use strict';

const fs = require('fs-extra')
, uploadDirectory = require(__dirname+'/../lib/file/uploaddirectory.js');

module.exports = async(db) => {
	// Update 1.7.8: Custom Emojis
	console.log('Adding custom emojis');
	// Create emoji directory
	await fs.ensureDir(`${uploadDirectory}/emoji/`);
	const template = require(__dirname+'/../configs/template.js.example');
	// Update global settings for emoji files and file sizes
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.emojiFiles': template.globalLimits.emojiFiles,
			'globalLimits.emojiFilesSize': template.globalLimits.emojiFilesSize,
			'globalLimits.emojiLimit': template.globalLimits.emojiLimit,
			'boardDefaults.customEmojis': false,
			'boardDefaults.emojiLimit': template.boardDefaults.emojiLimit,
		}
	});
	// For every board, add an emojis table.
	await db.collection('boards').updateMany({}, {
		'$set': {
			'emojis': {},
			'settings.customEmojis': false,
			'settings.emojiLimit': template.boardDefaults.emojiLimit,
		}
	});
};
