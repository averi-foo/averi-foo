'use strict';

const sanitizeOptions = require(__dirname+'/markdown/sanitizeoptions.js')
, sanitize = require('sanitize-html')
, emojiRegex = /:([a-zA-Z0-9_]+):/gmi;

// The regex above is a capture group in between colons, alphabetical and _ and numerical only

// Process is a function that processes a message to add emojis if emojis are enabled on board.
// It's designed to match :emoji_name: if emoji_name is in emojis which is board.emojis
// Emojis are functionally similar to flags in the database.

module.exports = async (board, emojis, message) => {
	console.log("Processing emojis in this message")
	
	// Run regex, If emoji which is matched text is in the emojis list then replace with emoji image
	let emojiMessage = message.replace(emojiRegex, ((board, emojis, match, emoji) => {
		if (emoji in emojis) {
			console.log("Success. Emoji: ", emoji, " is in ", emojis)
			return `<img class='asset-emoji' src='/emoji/${board}/${emojis[emoji]}'>`;
		} else {
			console.log(emoji, " is not in ", emojis)
			return match
		}
	}).bind(null, board, emojis))
	
	console.log("Output emojiMessage: ", emojiMessage)
	
	// Sanitize and return
	emojiMessage = sanitize(message, sanitizeOptions.after);
	return emojiMessage
}
	

