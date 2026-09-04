'use strict';

const { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/uploaddirectory.js');

module.exports = (files) => {

	//delete all the files and thumbs
	return Promise.all(files.map(async file => {
		return Promise.all([
			remove(`${uploadDirectory}/file/${file.filename}`),
			file.hasThumb ? remove(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`) : void 0,
			remove(`${uploadDirectory}/unapproved/${file.filename}`),
			remove(`${uploadDirectory}/unapproved/thumb/${file.hash}${file.thumbextension}`),
		]).catch(console.error);
	}));

};
