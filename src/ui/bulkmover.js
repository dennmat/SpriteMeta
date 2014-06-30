var Utils = require('../utils.js');
var Mustache = require('mustache');

class BulkMover {
	constructor(config) {
		this.options = $.extend({}, BulkMover.Defaults, config);
		
		this.types = $.extend({}, this.options.types);
		
		this.amount = 1;
		
		this.build();
	}
	
	action(direction) {
		var amount = parseInt(this.element.find('.mover-amount').val());
			
		if (isNaN(amount)) {
			return;
		}
		
		var type = this.element.find('.mover-type').val();
		
		if (this.options.callback !== null) {
			this.options.callback(type, amount, direction);
		}
	}
	
	build() {
		this.element = $(Mustache.to_html(BulkMover.Template));
	
		var typeSelector = this.element.find('.mover-type');
		
		var selectFirst = null;
		for (var typeKey in this.types) {
			var typeInfo = this.types[typeKey];
			
			if (selectFirst === null) {
				selectFirst = typeKey;
			}
			
			typeSelector.append(
				$('<option></option>', {text: typeInfo.label, value: typeKey})
			);
		}
		
		typeSelector.val(selectFirst);
		this.typeChanged(selectFirst);
		
		this.delegate();
		
		if (this.options.appendTo !== null) {
			this.options.appendTo.append(this.element);
		}
	}
	
	typeChanged(newType) {
		var typeInfo = this.types[newType];
		
		this.element.find('.unit').text(typeInfo.unit);
		
		if (typeInfo.defaultAmount !== undefined) {
			this.element.find('.mover-amount').val(typeInfo.defaultAmount);
		}
		
		var dirs = [Utils.KeyCodes.UP, Utils.KeyCodes.RIGHT, Utils.KeyCodes.DOWN, Utils.KeyCodes.LEFT];
		if (typeInfo.dirs !== undefined) {
			dirs = typeInfo.dirs;
		}
		
		if (dirs === null) {
			dirs = [];
			this.element.find('.mover-set').show();
		} else {
			this.element.find('.mover-set').hide();
		}
		
		this.element.find('.mover-up').hide();
		this.element.find('.mover-right').hide();
		this.element.find('.mover-down').hide();
		this.element.find('.mover-left').hide();
		
		for (var dir of dirs) {
			var selector = '';
			
			switch(dir) {
				case Utils.KeyCodes.UP: selector = 'up'; break;
				case Utils.KeyCodes.RIGHT: selector = 'right'; break;
				case Utils.KeyCodes.DOWN: selector = 'down'; break;
				case Utils.KeyCodes.LEFT: selector = 'left'; break;
			}
			
			this.element.find('.mover-'+selector).show();
		}
	}
	
	delegate() {
		this.element.on('change', '.mover-type', e => {
			this.typeChanged($(e.target).val());
		});
		
		this.element.on('click', '.mover-up', e => {
			e.preventDefault();
			this.action(Utils.KeyCodes.UP);
		});
		this.element.on('click', '.mover-right', e => {
			e.preventDefault();
			this.action(Utils.KeyCodes.RIGHT);
		});
		this.element.on('click', '.mover-down', e => {
			e.preventDefault();
			this.action(Utils.KeyCodes.DOWN);
		});
		this.element.on('click', '.mover-left', e => {
			e.preventDefault();
			this.action(Utils.KeyCodes.LEFT);
		});
		this.element.on('click', '.mover-set', e => {
			e.preventDefault();
			this.action(null);
		});
	}
}

BulkMover.Defaults = {
	types: {}, //Dict type value is the key, properties are the dict supports: label, unit, defaultAmount, dirs
	callback: null,
	appendTo: null
};

BulkMover.Template = `
<div class="bulk-mover">
	<table class="mover">
		<tr>
			<td colspan="3">
				<div class="title">
				Multi Selection Controller
				</div>
				<select class="mover-type">
				</select>
			</td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td><a href="#" class="button blue mover-up"><i class="icon-chevron-up"></i></a></td>
			<td>&nbsp;</td>
		</tr>
		<tr>
			<td><a href="#" class="button blue mover-left"><i class="icon-chevron-left"></i></a></td>
			<td><input type="text" class="mover-amount" value="1" /><span class="unit">px</span></td>
			<td><a href="#" class="button blue mover-right"><i class="icon-chevron-right"></i></a></td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td>
				<a href="#" class="button blue mover-down"><i class="icon-chevron-down"></i></a>
				<a href="#" class="button blue mover-set" style="display: none;"><i class="icon-forward"></i>&nbsp;Set</a>
			</td>
			<td>&nbsp;</td>
		</tr>
	</table>
</div>
`;

module.exports = {
	BulkMover: BulkMover
};