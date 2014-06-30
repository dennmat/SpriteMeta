var Utils = require('../utils.js');

class ElementSelector {
	constructor(config) {
		this.options = $.extend({}, ElementSelector.Defaults, config);
		
		this.value = null;
		this.values = {};
		this.valueOrder = [];
		
		this.isMultiSelect = this.options.multiSelect;
	
		this.build();
		
		if (this.options.appendTo !== null && this.options.fromBase === null) {
			this.options.appendTo.append(this.element);
		}
	}
	
	delegate() {
		this.element.on('click', 'li', e => {
			e.preventDefault();
			this.select($(e.target).data('value'), true, (this.isMultiSelect && e.ctrlKey));
		});
	}
	
	addChoices(choices) {
		for (var choice of choices) {
			this.addChoice(choice[0], choice[1]);
		}
	}
	
	addChoice(value, label) {
		this.values[value] = label;
		
		this.valueOrder.push(value);
		
		this.element.append($('<li></li>', {text: label, 'data-value': value}));
	}
	
	updateChoiceLabel(value, label) {
		this.values[value] = label;
		
		this.element.find('li[data-value="' + value + '"]').text(label);
	}
	
	removeChoice(value) {
		delete this.values[value];
		var idx = this.valueOrder.indexOf(value);
		this.valueOrder.splice(idx,1);
		
		this.element.find('li[data-value="' + value + '"]').remove();
	}
	
	clearChoices() {
		this.valueOrder.length = 0;
		this.values = {};
		this.value = null;
		
		this.element.empty();
	}
	
	build() {
		if (this.options.fromBase !== null) {
			this.element = this.options.fromBase;
		} else {
			this.element = $('<ul></ul>', {'class': 'element-selector'});
		}
		
		this.delegate();
	}
	
	update() {
		this.element.children('li.selected').removeClass('selected');
		
		if (this.value !== null) {
			if ($.isArray(this.value)) {
				for (var value of this.value) {
					this.element.children('li[data-value="' + value + '"]').addClass('selected');
				}
			} else {
				this.element.children('li[data-value="' + this.value + '"]').addClass('selected');
			}
		}
	}
	
	select(value, fireChange=true, selectMulti=false) {
		if (this.values[value] === undefined) {
			return;
		}
		
		if (selectMulti) {
			if (!$.isArray(this.value)) {
				this.value = [this.value];
			}
			this.value.push(value);
		} else {
			this.value = value;
		}
		
		this.update();
		
		if (this.options.onChange !== null) {
			this.options.onChange(this);
		}
	}
	
	val(setTo, fireChange=false) {
		if (setTo !== undefined) {
			this.select(setTo, fireChange);
		}
		
		if ($.isArray(this.value) && this.value.length == 1) {
			this.value = this.value[0];
		}
		
		return this.value;
	}
}

ElementSelector.Defaults = {
	fromBase: null,
	multiSelect: false,
	onChange: null,
	appendTo: null
};

module.exports = {
	ElementSelector: ElementSelector
};