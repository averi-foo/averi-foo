'use strict';

module.exports = async(db, redis) => {
	console.log('Adding featuredMediaURL and featuredMediaThumbURL');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'featuredMediaURL': '',
			'featuredMediaThumbURL': '',
		},
	});
	console.log('Cleared globalsettings cache');
	await redis.deletePattern('globalsettings');
};
