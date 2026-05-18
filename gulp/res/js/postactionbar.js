document.addEventListener("DOMContentLoaded", function(event) {
	// Remove emojis if you cannot find them.
	document.querySelectorAll("img.asset-emoji").forEach(function(img){
		img.onerror = function() {this.style.display='none';};
	})
	
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

