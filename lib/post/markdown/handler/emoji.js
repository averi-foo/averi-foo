'use strict';

module.exports = {
		
		regex: /:([a-zA-Z0-9_]+):/gmi,
		
		markdown: (permissions, match, emoji) => {
			console.log("Regex matched.")
			return `<span class='title'>Your emoji test: ${emoji}</span>`;
		},
		
};
