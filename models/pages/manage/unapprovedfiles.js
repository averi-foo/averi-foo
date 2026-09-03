'use strict';

const path = require('path')
, { pathExists } = require('fs-extra')
, directory = path.join(__dirname+'/../../../static');

module.exports = async (req, res, next) => {
	const isThumb = req.route.path.startsWith('/:board/manage/unapproved/thumb/');
	const correctDirectory = isThumb ? "unapproved/thumb" : "unapproved" 
	const movedDirectory = isThumb ? "file/thumb" : "file" 
	const exists = pathExists(path.join(directory, correctDirectory, req.params.filename))
	const options = {
		root: path.join(directory, exists ? correctDirectory : movedDirectory),
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true,
		},
	};
	
	const fileName = req.params.filename;
	return res.sendFile(fileName, options, (err) => {
		if (err) {
			if (err.code === 'ENOENT') {
				return res.status(404).render('404');
			} else {
				next(err);
			}
		} else {
			console.log('Sent:', fileName);
		}
	});
};
