'use strict';

const fs = require('fs-extra')
, uploadDirectory = require(__dirname+'/../lib/file/uploaddirectory.js');

module.exports = async(db) => {
	// Update 1.7.10: Unapproved files folder
	console.log('Adding unapproved files folder');
	// Create directory
	await fs.ensureDir(`${uploadDirectory}/unapproved/thumb/`);

};
