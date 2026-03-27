'use strict';

const { Posts } = require(__dirname+'/../../db/')
	, actionChecker = require(__dirname+'/../../lib/input/actionchecker.js')
	, Socketio = require(__dirname+'/../../lib/misc/socketio.js');

module.exports = async (req, res) => {

	// const { __ } = res.locals;

	let denied = true;
	let message = '';
	let log_message = '';

	// single file operation
	if (req.body.file_moderation_filename) {
		const filename = req.body.file_moderation_filename;
		const filehash = filename.substring(0, 6);
		switch (req.body.file_moderation_status) {
			case 'approve':
				await Posts.approveFile(filename);
				denied = false;
				message = `Approved ${filehash}`;
				break;
			case 'nsfw':
				req.body.delete_file = true; // delete files
				req.body.delete = true; // delete post
				req.body.global_ban = true;
				req.body.ban_duration = 86400000; // ban 1 day in ms
				req.body.ban_reason = `Uploaded NSFW hash ${filehash} that was denied`;
				req.body.no_appeal = false;
				message = `Denied NSFW ${filehash}`;
				log_message = message;
				break;
			case 'illegal':
				req.body.delete_file = true; // delete files
				req.body.delete = true; // delete post
				req.body.global_ban = true; // ban with duration of 1 year
				req.body.ban_reason = `Uploaded ILLEGAL hash ${filehash} that was denied`;
				req.body.no_appeal = false;
				message = `Denied ILLEGAL ${filehash}`;
				log_message = message;
				break;
		}
	// bulk approve
	} else {
		await Posts.approveFiles(res.locals.posts);
		denied = false;
	}

	if (!denied) {
		let fileCount = 0;

		for (let i = 0; i < res.locals.posts.length; i++) {
			const post = res.locals.posts[i];

			for (let j = 0; j < post.files.length; j++) {
				const file = post.files[j];
				if (
					(req.body.file_moderation_filename && file.filename == req.body.file_moderation_filename)
					|| !req.body.file_moderation_filename) {
					file.approved = true;
					fileCount++;
					log_message += `Approved ${file.filename.substring(0,6)},`;
				}

			} 

			Socketio.emitRoom(`${post.board}-${post.thread || post.postId}`, 'approvePost', {
				postId: post.postId,
				name: post.name,
				message: post.message,
				tripcode: post.tripcode,
				capcode: post.capcode,
				email: post.email,
				subject: post.subject,
				//existing post props
				_id: post._id,
				u: post.u,
				date: post.date,
				country: post.country,
				board: post.board,
				nomarkup: post.nomarkup,
				thread: post.thread,
				spoiler: post.spoiler,
				banmessage: post.banmessage,
				userId: post.userId,
				files: post.files,
				quotes: post.quotes,
				backlinks: post.backlinks,
				replyposts: post.replyposts,
				replyfiles: post.replyfiles,
				sticky: post.sticky,
				locked: post.locked,
				bumplocked: post.bumplocked,
				cyclic: post.cyclic,
			});

		}

		if (fileCount > 1 && !req.body.file_moderation_filename) {
			message = `Approved ${fileCount} files`;
		} 
	}

	// recalculate actions if necessary
	res.locals.actions = actionChecker(req, res);

	return {
		message: message,
		log_message: log_message,
	};
};
