'use strict';

const path = require('path')
, directory = path.join(__dirname+'/../../../static');

module.exports = async (req, res, next) => {
	console.log(req.route)
	const isThumb = req.route.startsWith('/:board/manage/unapproved/thumb/');
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
