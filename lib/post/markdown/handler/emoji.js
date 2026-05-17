'use strict';

module.exports = {
		
		regex: /:([a-zA-Z0-9_]+):/gmi,
		
		markdown: (permissions, match, emoji) => {
			console.log("Regex matched.")
			// This is a test for now.
			return `<img class='asset-emoji' src='/file/${emoji}.png'>`;
		},
		
};
