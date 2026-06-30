const onStegClicked = (e) => {
	const container = e.target.closest(".post-file").querySelector(".steganography-container")
	// find image thumb
	// hide it, add a canvas, set canvas width and height
	// add a slider, add functionality to everything
	// when clicked again, remove steg container and go back to normal.
	toggleSteganography(container, e.target)
};

const toggleSteganography = (container, link) => {
	if (!container) {
		console.log("Could not find container.")
		return
	}
	if (!link) {
		console.log("Could not find link.")
		return
	}
	const state = container.classList.contains("steg-hidden")
	if (state) {
		container.classList.remove("steg-hidden")
		let postFileSrc = container.closest(".post-file").querySelector(".post-file-src")
		let img = postFileSrc.querySelector("img")
		createSteganographyCanvas(img, container)
		postFileSrc.classList.add("steg-hidden")
		link.textContent = "[Close Steg]"
	} else {
		container.classList.add("steg-hidden")
		let postFileSrc = container.closest(".post-file").querySelector(".post-file-src")
		postFileSrc.classList.remove("steg-hidden")
		
		if (container.querySelector("canvas")) {
			container.querySelector("canvas").remove()
		}
		
		link.textContent = "Steg"
	}
};

const createSteganographyCanvas = (img, container) => {
	const stegCanvas = document.createElement("canvas")
	const context = stegCanvas.getContext("2d")
	canvas.width = img.width
	canvas.height = img.height
	container.insertBefore(stegCanvas,container.children[0])
	
	make_base();
	
	function make_base()
	{
		base_image = new Image();
		base_image.src = img.src;
		base_image.onload = function(){
			context.drawImage(base_image, 0, 0);
		}
	}
}

const handleSteg = (e) => {
	//add the remoderation toggle link and event listener
	if (!e.detail.hover) {
		const stegButtons = e.detail.post.querySelectorAll('.steganography-link');
		for (let i = 0; i < stegButtons.length; i++) {
			stegButtons[i].addEventListener('click', onStegClicked, false);
		}
	}
};

window.addEventListener('DOMContentLoaded', () => {
	// For every remod link, when clicked, do the remodhandler
	Array.from(document.getElementsByClassName('steganography-link')).forEach(link => {
		link.addEventListener('click', onStegClicked, false);
	});
})
window.addEventListener('addPost', handleSteg, false);



