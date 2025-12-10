'use strict';

module.exports = async(db, redis) => {
	console.log('Adding randomNames field to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.randomNames': [],
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
