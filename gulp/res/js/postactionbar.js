document.addEventListener("DOMContentLoaded", function(event) {
	//let postActionButtonContainer = document.getElementById("post-action-buttons")
	let postActionBarClose = document.getElementById("post-action-bar-close")
	let postActionBarLabelText = document.getElementById("post-action-bar-label-text")
	let postActionBar = document.getElementById("post-action-bar")
	let emojiButton = document.getElementById("emoji-button")
	let emojiBar = document.getElementById("emoji-bar")
	let messageBox = document.getElementById("message")
	
	if (postActionBar != null) {
		postActionBarClose.addEventListener("click",postActionBarHide)
		emojiButton.addEventListener("click",emojiButtonClicked)
		
		emojiBar.childNodes.forEach((node) =>{
			if (node.className == "asset-emoji-picker") {
				node.addEventListener("click",()=>{
					messageBox.value += node.alt
				})
			}
		})
		
	}
	
	function emojiButtonClicked() {
		postActionBarLabelText.textContent = "Emojis"
		postActionBarShow()
	}
	
	function postActionBarShow() {
		postActionBar.style.display = "flex";
	}
	
	function postActionBarHide() {
		postActionBar.style.display = "none";
	}
});

