'use strict';

const { Posts, Modlogs, Filters, Files } = require(__dirname+'/../../db/')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, { createHash } = require('crypto')
	, Mongo = require(__dirname+'/../../db/db.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js')
	, nameHandler = require(__dirname+'/../../lib/post/name.js')
	, emojiHandler = require(__dirname+'/../../lib/post/emojis.js')
	, getFilterStrings = require(__dirname+'/../../lib/post/getfilterstrings.js')
	, checkFilters = require(__dirname+'/../../lib/post/checkfilters.js')
	, filterActions = require(__dirname+'/../../lib/post/filteractions.js')
	, ModlogActions = require(__dirname+'/../../lib/input/modlogactions.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../lib/file/image/imagethumbnail.js')
	, getDimensions = require(__dirname+'/../../lib/file/image/getdimensions.js')
	, videoThumbnail = require(__dirname+'/../../lib/file/video/videothumbnail.js')
	, audioThumbnail = require(__dirname+'/../../lib/file/audio/audiothumbnail.js')
	, ffprobe = require(__dirname+'/../../lib/file/ffprobe.js')
	, fixGifs = require(__dirname+'/../../lib/file/image/fixgifs.js')
	, Socketio = require(__dirname+'/../../lib/misc/socketio.js')
	, { buildThread } = require(__dirname+'/../../lib/build/tasks.js')
	, FIELDS_TO_REPLACE = ['email', 'subject', 'message'];

module.exports = async (req, res) => {

/*
todo: handle some more situations
- last activity date
- correct bump date when editing thread or last post in a thread
*/

	const { __ } = res.locals;
	const { globalLimits, previewReplies, checkRealMimeTypes, thumbSize, thumbExtension, videoThumbPercentage, audioThumbnails} = config.get;
		
	const { board, post } = res.locals;
	const { emojiLimit, customEmojis } = res.locals.board.settings;

	//filters
	if (!res.locals.permissions.get(Permissions.BYPASS_FILTERS)) {

		//only global filters are checked, because anybody who could edit bypasses board filters
		const globalFilters = await Filters.findForBoard(null);

		let hitFilters = false;
		let { combinedString, strictCombinedString } = getFilterStrings(req, res);

		hitFilters = checkFilters(globalFilters, combinedString, strictCombinedString);
		if (hitFilters) {
			//if block or ban matched, only it is returned
			if (hitFilters[0].f.filterMode === 1 || hitFilters[0].f.filterMode === 2) {
				return filterActions(req, res, true, hitFilters[0].h, hitFilters[0].f, null);
			} else {
				for (const o of hitFilters) {
					await filterActions(req, res, true, o.h, o.f, null);
				}

				for (const field of FIELDS_TO_REPLACE) {
					//check filters haven't pushed a field past its limit
					if (req.body[field] && (req.body[field].length > globalLimits.fieldLength[field])) {
						return dynamicResponse(req, res, 400, 'message', {
							'title': __('Bad request'),
							'message': __(`After applying filters, ${field} exceeds maximum length of %s`, globalLimits.fieldLength[field]),
							'redirect': null
						});
					}
				}
			}
		}
	}

	//message hash
	let messageHash = null;
	if (req.body.message && req.body.message.length > 0) {
		const noQuoteMessage = req.body.message.replace(/>>\d+/g, '').replace(/>>>\/\w+(\/\d*)?/gm, '').trim();
		messageHash = createHash('sha256').update(noQuoteMessage).digest('base64');
	}
	
	//
	// File processing
	//
	let files = [];
	if (res.locals.numFiles > 0) {
		// Fast mime type check
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!mimeTypes.allowed(req.files.file[i].mimetype, allowedFileTypes)) {
				await deleteTempFiles(req).catch(console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': __('Bad request'),
									   'message': __('Mime type "%s" for "%s" not allowed', req.files.file[i].mimetype, req.files.file[i].name),
									   'redirect': redirect
				});
			}
		}
		
		// Slow proper mime type check
		if (checkRealMimeTypes) {
			for (let i = 0; i < res.locals.numFiles; i++) {
				if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
					deleteTempFiles(req).catch(console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad request'),
										   'message': req.files.file[i].realMimetype
										   ? __('Mime type "%s" invalid for file "%s"', req.files.file[i].realMimetype, req.files.file[i].name)
										   : __('Mime type invalid for file "%s"', req.files.file[i].name),
										   'redirect': redirect
					});
				}
			}
		}
		
		// upload, create thumbnails, get metadata, etc.
		for (let i = 0; i < res.locals.numFiles; i++) {
			const file = req.files.file[i];
			file.filename = file.sha256 + file.extension;
			
			//get metadata
			let processedFile = {
				filename: file.filename,
				spoiler: (!isStaffOrGlobal || userPostSpoiler) && req.body.spoiler && req.body.spoiler.includes(file.sha256),
				hash: file.sha256,
				originalFilename: req.body.strip_filename && req.body.strip_filename.includes(file.sha256) ? file.filename : file.name,
				mimetype: file.mimetype,
				size: file.size,
				extension: file.extension,
			};
			
			//phash
			if (file.phash) {
				processedFile.phash = file.phash;
			}
			
			//type and subtype
			let [type, subtype] = processedFile.mimetype.split('/');
			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}/file/${processedFile.filename}`);
			processedFile.sizeString = formatSize(processedFile.size);
			const saveFull = async () => {
				await Files.increment(processedFile);
				req.files.file[i].inced = true;
				if (!existsFull) {
					await moveUpload(file, processedFile.filename, 'file');
				}
			};
			if (mimeTypes.getOther().has(processedFile.mimetype)) {
				//"other" mimes from config, overrides main type to avoid codec issues in browser or ffmpeg for unsupported filetypes
				processedFile.hasThumb = false;
				processedFile.attachment = true;
				await saveFull();
			} else {
				const existsThumb = await pathExists(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
				try {
					switch (type) {
						case 'image': {
							processedFile.thumbextension = thumbExtension;
							const imageDimensions = await getDimensions(req.files.file[i].tempFilePath, null, true);
							if (Math.floor(imageDimensions.width*imageDimensions.height) > globalLimits.postFilesSize.imageResolution) {
								await deleteTempFiles(req).catch(console.error);
								return dynamicResponse(req, res, 400, 'message', {
									'title': 'Bad request',
									'message': `File "${req.files.file[i].name}" image resolution is too high. Width*Height must not exceed ${globalLimits.postFilesSize.imageResolution}.`,
									'redirect': redirect
								});
							}
							if (thumbExtension === '.jpg' && subtype === 'png') {
								//avoid transparency issues for jpg thumbnails on pngs (the most common case -- for anything else, use webp thumbExtension)
								processedFile.thumbextension = '.png';
							}
							processedFile.geometry = imageDimensions;
							processedFile.geometryString = `${imageDimensions.width}x${imageDimensions.height}`;
							const lteThumbSize = (processedFile.geometry.height <= thumbSize
							&& processedFile.geometry.width <= thumbSize);
							processedFile.hasThumb = !(mimeTypes.allowed(file.mimetype, {image: true})
							&& subtype !== 'png'
							&& lteThumbSize);
							await saveFull();
							if (!existsThumb) {
								await imageThumbnail(processedFile);
							}
							processedFile = fixGifs(processedFile);
							break;
						}
						case 'audio':
						case 'video': {
							//video metadata
							const audioVideoData = await ffprobe(req.files.file[i].tempFilePath, null, true);
							processedFile.duration = audioVideoData.format.duration;
							processedFile.durationString = timeUtils.durationString(audioVideoData.format.duration*1000);
							const videoStreams = audioVideoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
							if (videoStreams.length > 0) {
								processedFile.thumbextension = thumbExtension;
								processedFile.codec = videoStreams[0].codec_name;
								processedFile.geometry = {width: videoStreams[0].coded_width, height: videoStreams[0].coded_height};
								if (Math.floor(processedFile.geometry.width*processedFile.geometry.height) > globalLimits.postFilesSize.videoResolution) {
									await deleteTempFiles(req).catch(console.error);
									return dynamicResponse(req, res, 400, 'message', {
										'title': 'Bad request',
										'message': `File "${req.files.file[i].name}" video resolution is too high. Width*Height must not exceed ${globalLimits.postFilesSize.videoResolution}.`,
										'redirect': redirect
									});
								}
								processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}`;
								processedFile.hasThumb = true;
								await saveFull();
								if (!existsThumb) {
									const numFrames = videoStreams[0].nb_frames;
									const timestamp = ((numFrames === 'N/A' && subtype !== 'webm') || numFrames <= 1) ? 0 : processedFile.duration * videoThumbPercentage / 100;
									try {
										await videoThumbnail(processedFile, processedFile.geometry, timestamp);
									} catch (err) {
										//No keyframe after timestamp probably. ignore, we'll retry
										console.warn(err); //printing log because this error can actually be useful and we dont wanna mask it
									}
									let videoThumbStat = null;
									try {
										videoThumbStat = await fsStat(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
									} catch (err) { /*ENOENT probably, ignore*/ }
									if (!videoThumbStat || videoThumbStat.code === 'ENOENT' || videoThumbStat.size === 0) {
										//create thumb again at 0 timestamp and lets hope it exists this time
										await videoThumbnail(processedFile, processedFile.geometry, 0);
									}
								}
							} else {
								//audio file, or video with only audio streams
								type = 'audio';
								processedFile.mimetype = `audio/${subtype}`;
								processedFile.thumbextension = '.png';
								processedFile.hasThumb = audioThumbnails;
								processedFile.geometry = { thumbwidth: thumbSize, thumbheight: thumbSize };
								await saveFull();
								if (processedFile.hasThumb && !existsThumb) {
									await audioThumbnail(processedFile);
								}
							}
							break;
						}
						default:
							throw new Error(__('invalid file mime type: %s', processedFile.mimetype));
					}
				} catch (e) {
					console.error(e);
					await deleteTempFiles(req).catch(console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad request'),
										   'message': __('The server failed to process "%s". Possible unsupported or corrupt file.', req.files.file[i].name),
										   'redirect': redirect
					});
				}
			}
			
			if (processedFile.hasThumb === true && processedFile.geometry && processedFile.geometry.width != null) {
				if (processedFile.geometry.width < thumbSize && processedFile.geometry.height < thumbSize) {
					//dont scale up thumbnail for smaller images
					processedFile.geometry.thumbwidth = processedFile.geometry.width;
					processedFile.geometry.thumbheight = processedFile.geometry.height;
				} else {
					const ratio = Math.min(thumbSize/processedFile.geometry.width, thumbSize/processedFile.geometry.height);
					processedFile.geometry.thumbwidth = Math.floor(Math.min(processedFile.geometry.width*ratio, thumbSize));
					processedFile.geometry.thumbheight = Math.floor(Math.min(processedFile.geometry.height*ratio, thumbSize));
				}
			}
			
			//delete the temp file
			await remove(file.tempFilePath);
			
			files.push(processedFile);
		}
	}
	// because express middleware is autistic i need to do this
	deleteTempFiles(req).catch(console.error);
	
	//new name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(
		req.body.name,
		res.locals.permissions,
		board.settings,
		board.owner,
		board.staff,
		res.locals.user ? res.locals.user.username : null,
		null,
		globalLimits.fieldLength.name,
		res.locals.__
	);
	//new message and quotes
	const nomarkup = prepareMarkdown(req.body.message, false);
	const { message, quotes, crossquotes } = await messageHandler(nomarkup, req.body.board, post.thread, res.locals.permissions);
	
	// Enforce customEmoji limit
	if (customEmojis === true) {
		const emojiCount = (message.match(emojiHandler.regex) || []).length
		if (emojiCount > emojiLimit) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __(`Your message exceeded the custom emoji limit of ${emojiLimit}. Please use less emojis in your post.`),
				'redirect': null
			});
		}
	}

	//intersection/difference of quotes sets for linking and unlinking
	const oldQuoteIds = post.quotes.map(q => q._id.toString());
	const oldQuotesSet = new Set(oldQuoteIds);
	const newQuoteIds = quotes.map(q => q._id.toString());
	const newQuotesSet = new Set(newQuoteIds);

	const addedQuotesSet = new Set(newQuoteIds.filter(qid => !oldQuotesSet.has(qid)).map(Mongo.ObjectId));
	const removedQuotesSet = new Set(oldQuoteIds.filter(qid => !newQuotesSet.has(qid)).map(Mongo.ObjectId));

	//linking new added quotes
	if (addedQuotesSet.size > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': [...addedQuotesSet]
			}
		}, {
			'$push': {
				'backlinks': { _id: post._id, postId: post.postId }
			}
		});
	}

	//unlinking removed quotes
	if (removedQuotesSet.size > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': [...removedQuotesSet]
			}
		}, {
			'$pull': {
				'backlinks': {
					'postId': post.postId
				}
			}
		});
	}

	//update the post
	await Posts.db.updateOne({
		board: req.body.board,
		postId: post.postId
	}, {
		'$set': {
			edited: {
				username: req.body.hide_name ? null : req.session.user,
				date: new Date(),
			},
			nomarkup,
			message,
			'messagehash': messageHash || null,
			quotes,
			crossquotes,
			name,
			tripcode,
			capcode,
			email: req.body.email,
			subject: req.body.subject,
			files: files,
		}
	});

	//emit the edit over websocket so post gets updated live
	Socketio.emitRoom(`${board._id}-${post.thread || post.postId}`, 'markPost', {
		postId: post.postId,
		type: 'edit',
		name,
		message,
		tripcode,
		capcode,
		email: req.body.email,
		subject: req.body.subject,
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
		edited: {
			username: req.body.hide_name ? null : req.session.user,
			date: new Date(),
		}
	});

	//add the edit to the modlog
	await Modlogs.insertOne({
		board: board._id,
		showLinks: true,
		postLinks: [{
			postId: post.postId,
			thread: post.thread,
		}],
		actions: [ModlogActions.EDIT],
		public: true, //TODO: take an optional checkbox also controlled by a BO/global delegated perm
		date: new Date(),
		showUser: req.body.hide_name ? false : true,
		message: req.body.log_message || null,
		user: req.session.user,
		ip: {
			cloak: res.locals.ip.cloak,
			raw: res.locals.ip.raw,
		}
	});

	const buildOptions = {
		'threadId': post.thread || post.postId,
		'board': res.locals.board
	};

	//build thread immediately for redirect
	await buildThread(buildOptions);

	dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Post edited successfully'),
		'redirect': req.body.referer,
	});
	res.end();

	//rebuild the modlogs
	buildQueue.push({
		'task': 'buildModLog',
		'options': {
			'board': board,
		}
	});
	buildQueue.push({
		'task': 'buildModLogList',
		'options': {
			'board': board,
		}
	});

	//check if post is visible in preview posts
	let postInPreviewPosts = false;
	if (post.thread) {
		const threadPreviewPosts = await Posts.db.find({
			'thread': post.thread,
			'board': board._id
		},{
			'projection': {
				'postId': 1, //only get postId
			}
		}).sort({
			'postId': -1
		}).limit(previewReplies).toArray();
		postInPreviewPosts = threadPreviewPosts.some(p => p.postId <= post.postId);
	}

	if (post.thread === null || postInPreviewPosts) {
		const threadPage = await Posts.getThreadPage(board._id, post.thread || post.postId);
		//rebuild index page if its a thread or visible in preview posts
		buildQueue.push({
			'task': 'buildBoard',
			'options': {
				'board': res.locals.board,
				'page': threadPage
			}
		});
	}

	if (post.thread === null) {
		//rebuild catalog if its a thread to correct catalog tile
		buildQueue.push({
			'task': 'buildCatalog',
			'options': {
				'board': res.locals.board,
			}
		});
	}

};
