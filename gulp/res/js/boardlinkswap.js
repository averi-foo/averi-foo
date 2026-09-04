/* globals setLocalStorage */

window.addEventListener('DOMContentLoaded', () => {
	// Set boardlinkswap if setting doesnt exist
	if (localStorage.getItem('boardlinkswap') === undefined || localStorage.getItem('boardlinkswap') === null) {
		setLocalStorage('boardlinkswap', false);
	}
	// Get 'boardlinkswap' in local storage.
	let boardlinkswapEnabled = localStorage.getItem('boardlinkswap') == 'true';
	const boardlinkswapEnabledSetting = document.getElementById('boardlinkswap-setting');
	// Set the boardlinkswapEnabled var on boardlinkswap-setting checkmark change.
	const toggleBoardLinkSwapEnabled = () => {
		boardlinkswapEnabled = boardlinkswapEnabledSetting.checked;
		console.log('toggling boardlinkswap', boardlinkswapEnabled);
		setLocalStorage('boardlinkswap', boardlinkswapEnabled);
		checkBoardLinkSwap()
	};
	
	const checkBoardLinkSwap = () => {
		document.querySelectorAll(".boardtable a").forEach((link) => {
			link.href = boardlinkswapEnabled ? link.href.replace("/index.html","/catalog.html") : link.href.replace("/catalog.html","/index.html")
		})
	}
	
	boardlinkswapEnabledSetting.checked = boardlinkswapEnabled;
	boardlinkswapEnabledSetting.addEventListener('change', toggleBoardLinkSwapEnabled, false);
	checkBoardLinkSwap()
});

