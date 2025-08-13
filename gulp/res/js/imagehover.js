document.addEventListener('DOMContentLoaded', () => {
	let imageHoverEnabled = localStorage.getItem('imagehover') == 'true';
	if (document.querySelector(".file-thumb") != null && imageHoverEnabled) {
		if (document.querySelector(".hover-img") === null) {
			const hoverimg = document.createElement("img");
			const hoverimgstyle = document.createElement("style");
			hoverimgstyle.innerHTML = `.hover-img {
				width: auto;
				height:80%;
				max-width: 50%;
				max-height:80%;
				object-fit:contain;
				right: 0;
				margin-right: 1%;
				margin-top: 14vh;
				position: fixed;
				top: 0;
			}`
			hoverimg.loading = "lazy";
			hoverimg.className = "hover-img"
			document.body.appendChild(hoverimg);
			document.body.appendChild(hoverimgstyle);
		}

		document.body.addEventListener('mouseover', function(event) {
			if (event.target && event.target.classList.contains('file-thumb')) {
				if (event.target.src != undefined) {
					document.querySelector(".hover-img").src = event.target.parentElement.href
				}
			} else if (!event.target.classList.contains('hover-img')) {
				document.querySelector(".hover-img").style.visibility = "hidden";
			}
		});

		document.querySelector(".hover-img").onload = function() {
			document.querySelector(".hover-img").style.visibility = "visible"
		}
	}
}
