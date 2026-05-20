'use strict';

module.exports = async(db, redis) => {
	// Update 1.7.8: Custom Emojis but I forgot to clear the board caches.
	// New migration file because downgrading the migration is a headache.
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');
};
