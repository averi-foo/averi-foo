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
		container.closest(".post-file").querySelector(".post-file-src").classList.add("steg-hidden")
		link.textContent = "[Close Steg]"
	} else {
		container.classList.add("steg-hidden")
		container.closest(".post-file").querySelector(".post-file-src").classList.remove("steg-hidden")
		link.textContent = "Steg"
	}
};

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



