/* globals setLocalStorage threadwatcher watchedthread */

// Only works in a thread
if (isThread) {
	window.addEventListener('DOMContentLoaded', () => {
		// Set autowatch if setting doesnt exist
		if (localStorage.getItem('autowatch') === undefined) {
			setLocalStorage('autowatch', true);
		}
		// Get 'autowatch' in local storage.
		let autowatchEnabled = localStorage.getItem('autowatch') == 'true';
		const autowatchEnabledSetting = document.getElementById('autowatch-setting');
		// Set the autowatchEnabled var on autowatch-setting checkmark change.
		const toggleAutowatchEnabled = () => {
			autowatchEnabled = autowatchEnabledSetting.checked;
			console.log('toggling autowatch', autowatchEnabled);
			setLocalStorage('autowatch', autowatchEnabled);
		};

		autowatchEnabledSetting.checked = autowatchEnabled;
		autowatchEnabledSetting.addEventListener('change', toggleAutowatchEnabled, false);

		// Find post button and if you do find it, make it so that it watches the current thread.
		const postSubmitButton = document.getElementById('submitpost');
		const postMessageForm = document.querySelector("#postform").querySelector("#message")
		const postContainer = document.querySelector('.post-container');
		const postMessage = postContainer.querySelector('.post-message');
		const postDataset = postContainer.dataset;

		const watcherSubject = (postDataset.subject || (postMessage && postMessage.textContent) || `#${postDataset.postId}`).substring(0, 25);

		const watchThisThread = () => {
			if (autowatchEnabled) {
				threadWatcher.add(postDataset.board, postDataset.postId, { subject: watcherSubject, unread: 0, updatedDate: new Date()});
			}
		};

		const checkForControlEnter = (e) => {
			if (e.ctrlKey && e.key === 'Enter') {
				watchThisThread();
			}
		};

		postSubmitButton.addEventListener('click', watchThisThread, false);
		postMessageForm.addEventListener('keydown',checkForControlEnter, false);
	});
}
