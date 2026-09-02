'use strict';

const path = require('path')
, directory = path.join(__dirname+'/../../../static');

module.exports = async (req, res, next) => {
	const isThumb = req.path.startsWith('/file/unapproved/thumb/');
	console.log(req.path)
	console.log(req.params.filename)
	const correctDirectory = isThumb ? "unapproved/thumb" : "unapproved" 
	const options = {
		root: path.join(directory, correctDirectory),
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true,
		},
	};
	
	const fileName = req.params.filename;
	return res.sendFile(fileName, options, (err) => {
		if (err) {
			next(err);
		} else {
			console.log('Sent:', fileName);
		}
	});
};
