'use strict';

const sanitizeOptions = require(__dirname+'/markdown/sanitizeoptions.js')
, sanitize = require('sanitize-html')
, emojiRegex = /:([a-zA-Z0-9_]+):/gmi
, Boards = require(__dirname+'/../../db/boards.js');

// The regex above is a capture group in between colons, alphabetical and _ and numerical only

// Process is a function that processes a message to add emojis if emojis are enabled on board.
// It's designed to match :emoji_name: if emoji_name is in emojis which is board.emojis
// Emojis are functionally similar to flags in the database.

module.exports = {
	process: async (board, message) => {
		// If no board specified, return the original message.
		if (!board) { return message }
		const getBoard = await Boards.findOne(board)
		// Extra safety measure
		if (!getBoard) { return message }
		const emojis = getBoard.emojis
		// Run regex, If emoji which is matched text is in the emojis list then replace with emoji image
		let emojiMessage = message.replace(emojiRegex, ((board, emojis, match, emoji) => {
			if (emoji in emojis) {
				return `<img alt="${match}" class='asset-emoji emoji-${emoji}' loading="lazy" src='/emoji/${board}/${emojis[emoji]}'>`;
			} else {
				return match
			}
		}).bind(null, board, emojis))
		
		// Sanitize and return
		emojiMessage = sanitize(emojiMessage, sanitizeOptions.after);
		return emojiMessage
	},
	
	regex: emojiRegex
}
