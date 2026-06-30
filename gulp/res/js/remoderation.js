const onRemodClicked = (e) => {
	const filename = e.target.dataset.filename;
	const container = document.querySelector(`.approval-button-container[data-filename="${filename}"]`)
	toggleApprovalContainer(container,e.target);
};

const toggleApprovalContainer = (container, link) => {
	if (!container) {
		console.log("Could not find container.")
		return
	}
	if (!link) {
		console.log("Could not find link.")
		return
	}
	const state = container.classList.contains("approval-hidden")
	if (state) {
		container.classList.remove("approval-hidden")
		link.textContent = "[Close Remod]"
	} else {
		container.classList.add("approval-hidden")
		link.textContent = "Remod"
	}
};

const handleRemod = (e) => {
	//add the remoderation toggle link and event listener
	if (!e.detail.hover) {
		const remodButtons = e.detail.post.querySelectorAll('.remod-link');
		for (let i = 0; i < remodButtons.length; i++) {
			remodButtons[i].addEventListener('click', onRemodClicked, false);
		}
	}
};

// For every remod link, when clicked, do the remodhandler
if (isManage) {
	Array.from(document.getElementsByClassName('remod-link')).forEach(link => {
		link.addEventListener('click', onRemodClicked, false);
	});
	window.addEventListener('addPost', handleRemod, false);
}


