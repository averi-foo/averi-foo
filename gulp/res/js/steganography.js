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
	if (container.querySelector("canvas")) {
		container.querySelector("canvas").remove()
	}
	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d")
	canvas.width = img.width
	canvas.height = img.height
	container.insertBefore(canvas,container.children[0])
	
	context.clearRect(0, 0, img.width, img.height);
	context.font = '15px sans-serif';
	context.fillText("Processing...", 10, 30);
	
	base_image = new Image();
	base_image.src = img.src;
	base_image.onload = function() {
		context.clearRect(0, 0, img.width, img.height);
		context.drawImage(base_image, 0, 0);
		
		var stegdata = context.getImageData(0, 0, img.width, img.height);
		doUnhideImage(stegdata, slider.value);
		
		var result_image = new Image();
		context.putImageData(stegdata, 0, 0);
		stegdataurl = canvas.toDataURL();
		result_image.src = stegdataurl;
		result_image.onload = function() {
			ctx.clearRect(0, 0, 300, 300);
			ctx.drawImage(result_image, 0, 0, img.width, img.height);
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
	// For every remod link, when clicked, do the remodhandler
	Array.from(document.getElementsByClassName('steganography-link')).forEach(link => {
		link.addEventListener('click', onStegClicked, false);
	});
	
	Array.from(document.getElementsByClassName('steganography-slider')).forEach(slider => {
		slider.addEventListener("input", () => {
			slider.nextElementSibling.textContent = "Hidden Bits: " + slider.value
			console.log("Sliding:", slider.value);
		});
		
		slider.addEventListener("mouseup", () => {
			let container = slider.closest(".steganography-container")
			let postFileSrc = container.closest(".post-file").querySelector(".post-file-src")
			let img = postFileSrc.querySelector("img")
			createSteganographyCanvas(container,img,slider)
			console.log("Finished dragging");
		});
	});
})
window.addEventListener('addPost', handleSteg, false);



