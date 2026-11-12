'use strict';

const { Posts } = require(__dirname+'/../../../db/index.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js')
	, pageQueryConverter = require(__dirname+'/../../../lib/input/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {
	const { page, offset, queryString } = pageQueryConverter(req.query, limit);
	
	let posts = null;
	try {
		posts = await Posts.getFilesPending(offset, limit);
	} catch (err) {
		return next(err);
	}

	res.set('Cache-Control', 'private, max-age=1');

	if (req.path.endsWith('.json')) {
		res.json(posts.reverse());
	} else {		
		res.render('globalmanageapproval', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
			viewRawAccount: res.locals.permissions.get(Permissions.VIEW_RAW_ACCOUNT),
			posts,
			page,
			queryString,
		});
	} 
};
