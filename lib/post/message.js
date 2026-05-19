'use strict';

const quoteHandler = require(__dirname+'/quotes.js')
	, emojiHandler = require(__dirname+'/emojis.js')
	, { markdown } = require(__dirname+'/markdown/markdown.js')
	, sanitizeOptions = require(__dirname+'/markdown/sanitizeoptions.js')
	, Permission = require(__dirname+'/../permission/permission.js')
	, roleManager = require(__dirname+'/../permission/rolemanager.js')
	, sanitize = require('sanitize-html');

module.exports = async (inputMessage, boardName, threadId=null, permissions=null) => {

	let message = inputMessage;
	let quotes = [];
	let crossquotes = [];

	if (permissions === null) {
		//technically there has for a long time been a bug here, but it can be fixed later. permissions unknown for old msgs
		permissions = new Permission(roleManager.roles.ANON.base64);
	}

	//markdown a post, link the quotes, sanitize and return message and quote arrays
	if (message && message.length > 0) {
		// Handle Markdown
		message = markdown(message, permissions);
		// Handle quotes
		const { quotedMessage, threadQuotes, crossQuotes } = await quoteHandler.process(boardName, message, threadId);
		message = quotedMessage;
		quotes = threadQuotes;
		crossquotes = crossQuotes;
		// Get emojis
		message = await emojiHandler.process(boardName, message);
		// Sanitize message to only include a specific set of tags
		message = sanitize(message, sanitizeOptions.after);
	}

	return { message, quotes, crossquotes };

};
