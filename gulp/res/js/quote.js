/* globals isThread isRecent setLocalStorage */
window.addEventListener('DOMContentLoaded', () => {
	const postForm = document.querySelector('#postform');
	const topPostButton = document.querySelector('.post-button');
	const bottomPostButton = document.querySelector('.bottom-reply');
	const messageBox = document.getElementById('message');
	let threadInput = document.getElementsByName("thread");

	if (isManageRecent && threadInput.length != 0) {
		threadInput = threadInput[0];
	}

	const applicableHere = (isThread || isManageRecent)

	const openPostForm = (e) => {
		if (e) {
			e.preventDefault();
		}
		if (!postForm) {
			return;
		}
		//history.replaceState({}, '', '#postform');
		history.replaceState({},'',location.href.replace("#postform",""))
		postForm.style.display = 'flex';
		topPostButton.style.visibility = 'hidden';
		if (bottomPostButton) {
			bottomPostButton.style.display = 'none';
		}
		if (messageBox) {
			messageBox.focus();
		}
		postForm.dispatchEvent(new Event('opened'));
	};
	const closePostForm = (e) => {
		e.preventDefault();
		//history.replaceState({}, '', location.pathname);
		history.replaceState({},'',location.href.replace("#postform",""))
		postForm.style.display = 'none';
		topPostButton.style.visibility = 'visible';
		if (bottomPostButton) {
			bottomPostButton.style.display = '';
		}
	};
	if (postForm) {
		const closeButton = postForm ? postForm.querySelector('.close') : null;
		topPostButton.addEventListener('click', openPostForm, false);
		if (bottomPostButton) {
			bottomPostButton.addEventListener('click', openPostForm, false);
		}
		closeButton.addEventListener('click', closePostForm, false);
	}

	const addToMessageBox = (str) => {
		const index = messageBox.selectionStart;
		messageBox.value = `${messageBox.value.substr(0,index)}${str}${messageBox.value.substr(index)}`;
		messageBox.setSelectionRange(index+str.length, index+str.length); //this scroll anyway, no need to set scrolltop
	};

	const addQuoteToPostForm = function(quoteText) {
		openPostForm();
		addToMessageBox(quoteText);
		messageBox.focus();
		messageBox.dispatchEvent(new Event('input'));
	};

	const addQuoteNum = function(number) {
		let quoteText = `>>${number}\n`;
		let selection;
		if (window.getSelection) {
			selection = window.getSelection().toString();
		} else if (document.getSelection) {
			selection = document.getSelection().toString();
		} else if (document.selection) {
			selection = document.selection.createRange().text;
		}
		if (selection && selection.length > 0) {
			const quotedSelection = selection.split(/\r?\n/) //split by lines
				.map(line => line.trim().length > 0 ? `>${line}` : line) //make non empty lines greentext
				.join('\n'); //join it back together and newline
			quoteText += `${quotedSelection}\n`;
		}
		addQuoteToPostForm(quoteText);
	};

	function getPostMessage(postNum) {
	    // Select the post container using the data-post-id attribute
	    const postContainer = document.querySelector(`.post-container[data-post-id='${postNum}']`);
		
	    if (postContainer) {
	        // Find the post-message div inside the selected post container
	        const postMessage = postContainer.querySelector('.post-message');
		
	        if (postMessage) {
	            return postMessage.innerText.trim(); // Extract and return the text
	        }
	    }
	
	    return null; // Return null if the element is not found
	}

	const addQuote = function(number) {
		let quoteText = ``;
		const selection = getPostMessage(number);
		if (selection && selection.length > 0) {
			const quotedSelection = selection.split(/\r?\n/) //split by lines
				.map(line => line.trim().length > 0 ? `>${line}` : line) //make non empty lines greentext
				.join('\n'); //join it back together and newline
			quoteText += `${quotedSelection}`;
		}
		addQuoteToPostForm(quoteText);	
	};

	const insertThreadId = function(number) {
		threadInput.value = number;
	}

	const quoteNum = function(e) {
		const quoteNum = this.textContent.trim();
		const dataContainer = this.closest(".post-container")
		if (applicableHere && !e.ctrlKey) {
			if (isManageRecent && dataContainer) {
				insertThreadId(dataContainer.dataset.threadId || dataContainer.dataset.postId)
			}
			addQuoteNum(quoteNum);
		} else {
			setLocalStorage('clickedQuoteNum', quoteNum);
		}
	};

	const quote = function(e) {
		const quoteNum = this.getAttribute('post-id');
		const dataContainer = this.closest(".post-container")

		if (applicableHere && !e.ctrlKey) {
			addQuote(quoteNum);
			if (isManageRecent && dataContainer) {
				insertThreadId(dataContainer.dataset.threadId || dataContainer.dataset.postId)
			}
		} else {
			setLocalStorage('clickedQuote', quoteNum);
		}
	};

	//on loading page open with js method if user has scripts
	if (location.hash === '#postform') {
		openPostForm();
	}
	if (applicableHere) {
		let quoteNum = null;
		if (localStorage.getItem('clickedQuoteNum')) {
			quoteNum = localStorage.getItem('clickedQuoteNum');
			addQuoteNum(quoteNum);
		}
		if (localStorage.getItem('clickedQuote')) {
			quoteNum = localStorage.getItem('clickedQuote');
			addQuote(quoteNum);
		}

		if (quoteNum != null) {
			//scroll to the post you quoted
			const quotingPost = document.getElementById(quoteNum);
			if (quotingPost) {
				quotingPost.scrollIntoView();
			}
		}

		localStorage.removeItem('clickedQuoteNum')
		localStorage.removeItem('clickedQuote');
	}

	const addQuoteNumListeners = (l) => {
		for (let i = 0; i < l.length; i++) {
			l[i].addEventListener('click', quoteNum, false);
		}
	};

	const addQuoteListeners = (l) => {
		for (let i = 0; i < l.length; i++) {
			l[i].addEventListener('click', quote, false);
		}
	};

	addQuoteNumListeners(document.getElementsByClassName('post-quote-num'));
	addQuoteListeners(document.getElementsByClassName('post-quote'))

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const post = e.detail.post;
		addQuoteNumListeners(post.getElementsByClassName('post-quote-num'));
		addQuoteListeners(post.getElementsByClassName('post-quote'));
	});

});
