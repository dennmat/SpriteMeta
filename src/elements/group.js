var Base = require('./base.js');

var Utils = require('../utils.js');

var Mustache = require('mustache');

class Group extends (Base.Element, Base.Focusable) {
	constructor(editor, info) {
		this.editor = editor;

		this.rect = null;
		this.sprites = [];

		this.element = null;

		this.name = '';
		this.id = null;

		if (info !== undefined) {
			this.load(info);
		}

		this.build();
	}

	setId(id) {
		this.id = id;

		if (this.name.length === 0) {
			this.name = "Untitled Group " + id;
		}

		this.element.data('group-id', id);
	}

	build() {
		var container = this.editor.getEditorContainer();

		this.element = $(Mustache.to_html(Group.boxTemplate, {}));

		this.reposition();

		container.append(this.element);
	}

	reposition() {
		var screen_pos = this.rect.copy();
		screen_pos.adjustToZoom(this.editor.zoom);

		var adjusted_pos = this.editor.activeProject.imagePosToRelativePos(screen_pos.x, screen_pos.y);
		adjusted_pos.w = screen_pos.w;
		adjusted_pos.h = screen_pos.h;

		this.element.css(adjusted_pos.toCss());		
	}

	load(info) {
		this.rect = (info !== undefined && info.rect !== undefined)? info.rect : new Utils.Rect();
	}

	serialize() {
		return {
			name: this.name,
			rect: this.rect.toDict(),
			sprites: this.sprites
		}
	}

	inBounds(x, y) {
		var pointRect = new Utils.Rect(x, y, 1, 1);
		return pointRect.hasIntersect(this.rect);
	}

	renderOptions() {
		Group.updateOptions(this);
		return Group.getOptionsElement();
	}

	keyUpEvent(e) {
		var dirty = false;

		if (e.which === Utils.KeyCodes.UP) {
			if (e.shiftKey) {
				this.rect.h -= 1;
			} else {
				this.rect.y -= 1;
			}
			dirty = true;
		} else if (e.which === Utils.KeyCodes.DOWN) {
			if (e.shiftKey) {
				this.rect.h += 1;
			} else {
				this.rect.y += 1;
			}
			dirty = true;
		} else if (e.which === Utils.KeyCodes.LEFT) {
			if (e.shiftKey) {
				this.rect.w -= 1;
			} else {
				this.rect.x -= 1;
			}
			dirty = true;
		} else if (e.which === Utils.KeyCodes.RIGHT) {
			if (e.shiftKey) {
				this.rect.w += 1;
			} else {
				this.rect.x += 1;
			}
			dirty = true;
		}

		if (dirty) {
			this.reposition();
		}

		return dirty;
	}

	keyDownEvent() {}
	mouseMoveEvent() {}
}

Group.boxTemplate = `
	<div class="group-box"></div>
`;

Group.optionsHtml = `
	<table>
		<tr>
			<td colspan="3"><input type="text" name="group-name" placeholder="Group Name" /></td>
		</tr>
		<tr>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</table>
`;
Group.optionsElement = null;
Group.boundGroup = null;

Group.getOptionsElement = function() {
	if (Group.optionsElement === null) {
		Group.optionsElement = $(Group.optionsHtml);
		Group.delegate();
	}

	return Group.optionsElement;
};

Group.bindTo = function(group) {
	Group.boundGroup = group;
};

Group.delegate = function() {
	var container = Group.optionsElement;

	container.on('change', 'input[name="group-name"]', e => {
		var newVal = $(e.target).val();
		if (newVal.trim().length == 0) {
			//to do Utils.Alert
			console.log('ENTER A VALID NAME!');
			$(e.target).focus();
		}

		Group.boundGroup.name = newVal.trim();
	});
};

Group.updateOptions = function(group) {
	if (Group.optionsElement === null) {
		Group.getOptionsElement();
	}
	
	Group.optionsElement.find('input[name="group-name"]').val(group.name);

	Group.bindTo(group);
};

module.exports = {
	Group: Group
};