'use strict';

const sanitizeOptions = require(__dirname+'/markdown/sanitizeoptions.js')
, sanitize = require('sanitize-html')
, emojiRegex = /:([a-zA-Z0-9_]+):/gmi;
// The regex above is a capture group in between colons, alphabetical and _ and numerical only

module.exports = {
	// Board, name of the board, string
	// Emojis, list of emojis, dictionary
	// Message, string.
	process: async (board, emojis, message) => {
		// Process emojis here, replace all :test: with emoji in emojis list
		console.log("Processing emojis in this message")
		let emojiMessage = message.replace(emojiRegex, markdown.bind(null, board, emojis))
		// Sanitize and return
		emojiMessage = sanitize(message, sanitizeOptions.after);
		// TODO: Figure out if we need escapes or not. Prolly not.
		return emojiMessage
	},
	
	// Match is :emoji_name: while emoji is emoji_name
	markdown: async (board, emojis, match, emoji) => {
		// If emoji which is matched text is in the emojis list then replace with emoji image
		if (emoji in emojis) {
			return `<img class='asset-emoji' src='/emoji/${board}/${emojis[emoji]}'>`;
		} else {
			return match
		}
	}
};
