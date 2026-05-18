document.addEventListener("DOMContentLoaded", function(event) {
	//let postActionButtonContainer = document.getElementById("post-action-buttons")
	let postActionBarClose = document.getElementById("post-action-bar-close")
	let postActionBarLabelText = document.getElementById("post-action-bar-label-text")
	let postActionBar = document.getElementById("post-action-bar")
	let emojiButton = document.getElementById("emoji-button")
	
	if (postActionBar != null) {
		postActionBarClose.addEventListener("click",postActionBarHide)
		emojiButton.addEventListener("click",emojiButtonClicked)
	}
	
	
	function emojiButtonClicked() {
		postActionBarLabelText.textContent = "Emojis"
		postActionBarShow()
	}
	
	function postActionBarShow() {
		postActionBar.style.display = "block";
	}
	
	function postActionBarHide() {
		postActionBar.style.display = "none";
	}
});

