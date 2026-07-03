'use strict';

const { Posts } = require(__dirname + '/../../db/');

module.exports = async (locals) => {

	const { __, __n, posts } = locals;
	const filenameToSpoiler = locals.filename_to_spoiler;

	// filter to ones not spoilered
	const filteredPosts = posts.filter(post => {
		return !post.spoiler && post.files.length > 0;
	});

	if (filteredPosts.length === 0) {
		return {
			message: __('No files to spoiler'),
		};
	}
	// single file action
	if (filenameToSpoiler) {
		const results = await Posts.spoilerFile(filenameToSpoiler);
		return {
			message: __n(`Spoilered ${results.modifiedCount} files`)
		};
	} else {
		return {
			message: __n('Spoilered %s posts', filteredPosts.length),
			action: '$set',
			query: {
				'spoiler': true
			}
		}
	};

};
