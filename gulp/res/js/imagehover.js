/* globals setLocalStorage */

window.addEventListener('DOMContentLoaded', () => {
	// Set the imageHover localstorage setting on checkmark change.
	// Behaviour replicated from expand.js, etc.
	let imageHoverEnabled = localStorage.getItem('imagehover') == 'true';
	const imageHoverSetting = document.getElementById('imagehover-setting');
	const toggleImageHover = () => {
		imageHoverEnabled = imageHoverSetting.checked;
		console.log('toggling image hover', imageHoverEnabled);
		setLocalStorage('imagehover', imageHoverEnabled);
	};

	imageHoverSetting.checked = imageHoverEnabled;
	imageHoverSetting.addEventListener('change', toggleImageHover, false);

	if (document.querySelector(".file-thumb") != null) {
		if (document.querySelector(".hover-img") === null) {
			const hoverimg = document.createElement("img");
			hoverimg.loading = "lazy";
			hoverimg.className = "hover-img"
			document.body.appendChild(hoverimg);
		}

		document.body.addEventListener('mouseover', function(event) {
			if (imageHoverEnabled && event.target && event.target.classList.contains('file-thumb')) {
				if (event.target.src != undefined) {
					document.querySelector(".hover-img").src = event.target.parentElement.href
				}
			} else if (!event.target.classList.contains('hover-img')) {
				document.querySelector(".hover-img").style.visibility = "hidden";
			}
		});

		document.querySelector(".hover-img").onload = function() {
			if (imageHoverEnabled) {
				document.querySelector(".hover-img").style.visibility = "visible"
			}
		}
	}
});
