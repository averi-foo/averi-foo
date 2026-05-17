'use strict';

module.exports = {
		
		regex: /:([a-zA-Z0-9_]+):/gmi,
		
		markdown: (permissions, match, emoji, board="test") => {
			console.log("Regex matched.")
			// This is a test for now.
			return `<img class='asset-emoji' src='/emoji/${board}/${emoji}.png'>`;
		},
		
};
