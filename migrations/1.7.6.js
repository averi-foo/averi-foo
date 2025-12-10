'use strict';

module.exports = async(db, redis) => {
	console.log('Adding randomNames field and randomNamesEnabled bool to boards');
	await db.collection('boards').updateMany({}, {
		'$set': {
			'settings.randomNames': [],
			'settings.randomNamesEnabled': false,
		}
	});
	console.log('Cleared boards cache');
	await redis.deletePattern('board:*');
};
