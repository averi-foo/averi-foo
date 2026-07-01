// Steganography functionality, ported from https://www.incoherency.co.uk/image-steganography/#unhide
// To help prevent or otherwise detect embedded images

const onStegClicked = (e) => {
	const container = e.target.closest(".post-file").querySelector(".steganography-container")
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
		let img = postFileSrc.querySelector(".file-thumb")
		let slider = container.querySelector(".steganography-slider")
		createSteganographyCanvas(img, container, slider)
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

const createSteganographyCanvas = (img, container, slider) => {
	const canvas = container.querySelector("canvas") ? container.querySelector("canvas") : document.createElement("canvas")
	let expanded = canvas.dataset.expanded == "true"
	
	if (!img.parentElement) {
		console.log("Steg error: Image doesn't have a parent A link.")
		return
	}
	if (img.parentElement.tagName != "A") {
		console.log("Steg error: Image doesn't have the correct parent element.")
		return
	}
	
	const context = canvas.getContext("2d")
	const fullSrc = img.parentElement.href;
	let canvasWidth = img.width || img.offsetWidth
	let canvasHeight = img.height || img.offsetHeight
	
	if (!expanded) {
		canvas.width = canvasWidth
		canvas.height = canvasHeight
	}
	
	if (!container.querySelector("canvas")) {
		container.insertBefore(canvas,container.children[0])
		canvas.classList.add("steg-canvas")
		canvas.addEventListener("click", () => {
			expanded = !expanded;
			canvas.dataset.expanded = expanded ? "true" : "false"
			createSteganographyCanvas(img,container,slider)
		});
	}
	
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	context.font = '15px sans-serif';
	context.fillText("Processing...", 10, 30);
	
	base_image = new Image();
	base_image.src = fullSrc;
	base_image.onload = function() {
		if (expanded) {
			canvasWidth = base_image.width
			canvasHeight = base_image.height
			canvas.width = canvasWidth
			canvas.height = canvasHeight
		}
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.drawImage(base_image, 0, 0, canvasWidth, canvasHeight);
		if (slider.value == 0) return;
		
		var stegdata = context.getImageData(0, 0, canvasWidth, canvasHeight);
		doUnhideImage(stegdata, slider.value);
		
		context.putImageData(stegdata, 0, 0);
		stegdataurl = canvas.toBlob((blob) => {
			var result_image = new Image();
			result_image.src = URL.createObjectURL(blob);
			result_image.onload = function() {
				context.clearRect(0, 0, canvasWidth, canvasHeight);
				context.drawImage(result_image, 0, 0, canvasWidth, canvasHeight);
			}
		});
		
	}
}

const handleSteganographySlider = (slider) => {
	slider.addEventListener("input", () => {
		slider.nextElementSibling.textContent = "Hidden Bits: " + slider.value
	});
	
	slider.addEventListener("mouseup", () => {
		let container = slider.closest(".steganography-container")
		let postFileSrc = container.closest(".post-file").querySelector(".post-file-src")
		let img = postFileSrc.querySelector(".file-thumb")
		createSteganographyCanvas(img,container,slider)
	});
}

const handleSteg = (e) => {
	if (!e.detail.hover) {
		const stegButtons = e.detail.post.querySelectorAll('.steganography-link');
		const stegSlider = e.detail.post.querySelectorAll(".steganography-slider");
		for (let i = 0; i < stegButtons.length; i++) {
			stegButtons[i].addEventListener('click', onStegClicked, false);
		}
		for (let i = 0; i < stegSlider.length; i++) {
			handleSteganographySlider(stegSlider[i])
		}
	}
};

// taken from incoherency.com
function doUnhideImage(stegdata, bits) {
	var stegpix = stegdata.data;
	
	var w = stegdata.width;
	var h = stegdata.height;
	
	for (var y = 0; y < h; y++) {
		var stegy = y*w;
		for (var x = 0; x < w; x++) {
			var stegidx = 4*(stegy + x);
			
			// red
			stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;
			
			// green
			++stegidx;
			stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;
			
			// blue
			++stegidx;
			stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;
		}
	}
}

window.addEventListener('DOMContentLoaded', () => {
	Array.from(document.getElementsByClassName('steganography-link')).forEach(link => {
		link.addEventListener('click', onStegClicked, false);
	});
	
	Array.from(document.getElementsByClassName('steganography-slider')).forEach(slider => {
		handleSteganographySlider(slider)
	});
})

window.addEventListener('addPost', handleSteg, false);



