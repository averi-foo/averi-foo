document.addEventListener("DOMContentLoaded", function(event) {
	if (document.querySelector("#customflag") != null) {
		const inputValue = localStorage.getItem("customflag-" + window.location.pathname.split("/")[1])
		const newTomSelect = new TomSelect("#customflag",{
			render: {
				option: function(data) {
					if (data.src != undefined) {
																					//  ${data.text}
						return `<div><img src="${data.src}" class="ts-image-option" /></div>`;
					}
					else
					{
						return `<div>${data.text}</div>`;
					}
				},
				item: function(data) {
					if (data.src != undefined) {
						return `<div><img src="${data.src}" class="ts-image-option" /><span class="ts-option-text">${data.text}</span></div>`;
					}
					else
					{
						return `<div>${data.text}</div>`;
					}
				}
			},
			openOnFocus: true,
			dropdownParent: 'body',
			allowEmptyOption: true,
			placeholder: "Enter flag name to search...",
			hidePlaceholder: true,
			maxOptions: null,
			onItemAdd: function() {this.settings.hidePlaceholder = true},
			onDropdownOpen: function() {
				const tsOptionText = document.querySelector('.ts-option-text');
				if (tsOptionText == null) {return}
				const tsInput = document.querySelector('input#customflag-ts-control')
				tsOptionText.style.display = 'none';
				this.settings.hidePlaceholder = false;
			},
			onDropdownClose: function() {
				const tsOptionText = document.querySelector('.ts-option-text');
				if (tsOptionText == null) {return}
				const tsInput = document.querySelector('input#customflag-ts-control')
				tsInput.blur()
				tsOptionText.style.display = 'inline-flex';
				this.settings.hidePlaceholder = true;
			}
		})
		newTomSelect.setValue(inputValue)
	}
});
