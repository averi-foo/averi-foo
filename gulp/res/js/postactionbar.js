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
		activateScrollLeft(emojiBar)
		emojiButton.addEventListener("click",emojiButtonClicked)
		emojiBar.childNodes.forEach((node) =>{
			if (node.className == "asset-emoji-picker") {
				node.addEventListener("mousedown",(e)=>{
					e.preventDefault()
					typeInTextarea(node.alt, messageBox)
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
	
	function scrollHorizontally(e) {
		e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		this.scrollLeft += (delta * 40); // Multiplied by 40
		e.preventDefault();
	}
	
	function activateScrollLeft(div) {
		if (div.addEventListener) {
			// IE9, Chrome, Safari, Opera
			div.addEventListener('mousewheel', scrollHorizontally, false);
			// Firefox
			div.addEventListener('DOMMouseScroll', scrollHorizontally, false);
		} else {
			// IE 6/7/8
			div.attachEvent('onmousewheel', scrollHorizontally);
		}
	}
	
	function typeInTextarea(newText, el = document.activeElement) {
		const [start, end] = [el.selectionStart, el.selectionEnd];
		el.setRangeText(newText, start, end, 'select');
	}
	
});

