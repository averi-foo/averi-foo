'use strict';

const { Posts, Files } = require(__dirname+'/../../db/')
, { remove, pathExists, stat: fsStat } = require('fs-extra')
, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
, moveUpload = require(__dirname+'/../../lib/file/moveupload.js')
, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
, formatSize = require(__dirname+'/../../lib/converter/formatsize.js')
, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
, imageThumbnail = require(__dirname+'/../../lib/file/image/imagethumbnail.js')
, videoThumbnail = require(__dirname+'/../../lib/file/video/videothumbnail.js')
, audioThumbnail = require(__dirname+'/../../lib/file/audio/audiothumbnail.js')
, getDimensions = require(__dirname+'/../../lib/file/image/getdimensions.js')
, ffprobe = require(__dirname+'/../../lib/file/ffprobe.js')
, fixGifs = require(__dirname+'/../../lib/file/image/fixgifs.js')
, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js')
;

module.exports = async (req, res) => {
	let files = [];
	if (res.locals.numFiles > 0) {
		// Unique file check
		if ((req.body.thread && fileR9KMode === 1) || fileR9KMode === 2) {
			const filesHashes = req.files.file.map(f => f.sha256);
			const postWithExistingFiles = await Posts.checkExistingFiles(res.locals.board._id, (fileR9KMode === 2 ? null : req.body.thread), filesHashes);
			if (postWithExistingFiles != null) {
				await deleteTempFiles(req).catch(console.error);
				const conflictingFiles = req.files.file
				.filter(f => postWithExistingFiles.files.some(fx => fx.hash === f.sha256))
				.map(f => f.name)
				.join(', ');
				const r9kFilesMessage = __(`Uploaded files must be unique ${fileR9KMode === 1 ? 'in this thread' : 'on this board'}.`)
				+ '\n'
				+ conflictingFiles.length > 1 //slightly gross but __mf() is more so
				? __('At least the following file is not unique: %s', conflictingFiles)
				: __('At least the following files are not unique: %s', conflictingFiles);
				return dynamicResponse(req, res, 409, 'message', {
					'title': 'Conflict',
					'message': r9kFilesMessage,
					'redirect': redirect,
				});
			}
		}
		
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
			
			// TODO: File hash denial?
			// if ((await Approval.isDenied(file.sha256)) === true) {
			// 	console.error('User tried to upload bad file');
			// 	deleteTempFiles(req).catch(console.error);
			// 	return dynamicResponse(req, res, 429, 'message', {
			// 		'title': __('Bad file'),
			// 		'message': __('You can not upload that file'),
			// 		'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
			// 	});
			// }
			
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
				thumbextension: thumbExtension,
				approved: false,
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
					await moveUpload(file, processedFile.filename, 'unapproved');
				}
			};
			if (mimeTypes.getOther().has(processedFile.mimetype)) {
				//"other" mimes from config, overrides main type to avoid codec issues in browser or ffmpeg for unsupported filetypes
				processedFile.hasThumb = false;
				processedFile.attachment = true;
				await saveFull();
			} else {
				if (processedFile.mimetype === 'image/gif' && 
					animatedGifThumbnails === true) {
					processedFile.thumbextension = '.gif';
					}
					// Should always return false when uploading a new image and always return true when uploading a pre-approved image
					let existsThumb = await pathExists(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
				try {
					switch (type) {
						case 'image': {
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
								existsThumb = await pathExists(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
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
								existsThumb = await pathExists(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
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
	
	return files
}
