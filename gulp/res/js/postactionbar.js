document.addEventListener("DOMContentLoaded", function(event) {
	//let postActionButtonContainer = document.getElementById("post-action-buttons")
	let postActionBarClose = document.getElementById("post-action-bar-close")
	let postActionBar = document.getElementById("post-action-bar")
	let emojiButton = document.getElementById("emoji-button")
	
	if (postActionBar != null) {
		postActionBarClose.addEventListener("click",postActionBarHide)
		emojiButton.addEventListener("click",emojiButtonClicked)
	}
	
	
	function emojiButtonClicked() {
		postActionBarShow()
	}
	
	function postActionBarShow() {
		postActionBar.style.display = "block";
	}
	
	function postActionBarHide() {
		postActionBar.style.display = "none";
	}
});

