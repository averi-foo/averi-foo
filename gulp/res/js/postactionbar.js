document.addEventListener("DOMContentLoaded", function(event) {
	//let postActionButtonContainer = document.getElementById("post-action-buttons")
	let postActionBarLabel = document.getElementById("post-action-bar-label")
	let postActionBar = document.getElementById("post-action-bar")
	let emojiButton = document.getElementById("emoji-button")
	let emojiBar = document.getElementById("emoji-bar")
	let messageBox = document.getElementById("message")
	
	if (postActionBar != null) {
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
		if (postActionBarLabel.textContent != "Emojis") {
			postActionBarLabel.textContent = "Emojis"
			postActionBarShow()
		} else {
			postActionBarToggle()
		}
	}
	
	function postActionBarToggle() {
		if (postActionBar.style.display == "none") {
			postActionBarShow()
		} else {
			postActionBarHide()
		}
	}
	
	function postActionBarShow() {
		postActionBar.style.display = "flex";
	}
	
	function postActionBarHide() {
		postActionBar.style.display = "none";
	}
});

