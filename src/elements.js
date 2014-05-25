var Utils = require('../c/utils.js');

var Mustache = require('mustache');

/******
Interfaces don't work as expected in traceur yet
so I'm defining one a class here:

a Class that implements these member(s):
-hasFocus
and these method(s):
-receiveFocus
-blur
-acceptEvent(type, event)
-inBounds(x, y)

Will be focusable from the editor and can receive
certain events
******/

class Focusable {
	constructor() {
		this.hasFocus = false;
	}

	receiveFocus() {
		this.hasFocus = true;
	}

	blur() {
		this.hasFocus = false;
	}

	inBounds(x, y) {} //Determine if a mouse click lands within the element and should receive focus

	renderOptions() {}

	acceptEvent(type, event) {
		switch(type) {
			case Focusable.KeyDownEvent:
				this.keyDownEvent(event);
				break;
			case Focusable.KeyUpEvent:
				this.keyUpEvent(event);
				break;
			case Focusable.MouseMoveEvent:
				this.mouseMoveEvent(event);
				break;
		}
	}
}
Focusable.KeyDownEvent = 0;
Focusable.KeyUpEvent = 1;
Focusable.MouseMoveEvent = 2;


//This is what's created before we know what it will be
class Selection extends Focusable {
	constructor(editor, rect) {
		super();

		this.editor = editor;

		this.pos = (rect !== undefined)? rect : new Utils.Rect();

		this.element = null;

		//Focusable
		this.hasFocus = false;

		this.build();
	}

	build() {
		this.element = $(Mustache.to_html(Selection.template));
		
		this.reposition();

		this.editor.getEditorContainer().append(this.element);
	}

	/*move(deltaX, deltaY) {
		this.pos.x += deltaX;
		this.pos.y += deltaY;

		this.update();
	}*/

	reposition() {
		var screenPos = this.pos.copy();
		screenPos.adjustToZoom(this.editor.zoom);

		var adjustedPos = this.editor.active_project.imagePosToRelativePos(screenPos.x, screenPos.y);
		adjustedPos.w = screenPos.w;
		adjustedPos.h = screenPos.h;

		var imagePosition = this.editor.active_project.getImagePosition();

		this.element.css(adjustedPos.toCss());
	}

	setDimensions(w, h) {
		var tempRect = new Utils.Rect(this.pos.x, this.pos.y, w, h);
		tempRect.removeZoom(this.editor.zoom);

		this.pos = tempRect;

		//console.log("SETTING DIMENSIONS", w, h, this.pos);

		this.reposition();
	}

	inBounds(x, y) {
		var pointRect = new Utils.Rect(x, y, 1, 1);
		return pointRect.hasIntersect(this.pos);
	}

	renderOptions() {}

	keyUpEvent() {}
	keyDownEvent() {}
	mouseMoveEvent() {}

	destroy() {
		this.element.remove();
		this.pos = null;
	}
}
Selection.template = `
<div class="selection"></div>
`;

class Element {
	reposition() {}
	load(info) {}
	serialize() {}
}

class Sprite extends (Element, Focusable) {
	constructor(editor, info) {
		this.editor = editor;
		this.rect = new Utils.Rect();

		if (info) {
			this.load(info);
		}
	}

	reposition() {
		var screen_pos = this.rect.copy();
		screen_pos.adjustToZoom(this.editor.zoom);

		var adjusted_pos = this.editor.active_project.imagePosToRelativePos(screen_pos.x, screen_pos.y);
		adjusted_pos.w = screen_pos.w;
		adjusted_pos.h = screen_pos.h;

		this.element.css(adjusted_pos.toCss());
	}

	load(info) {

	}

	serialize() {

	}

	inBounds(x, y) {
		var pointRect = new Utils.Rect(x, y, 1, 1);
		return pointRect.hasIntersect(this.rect);
	}

	renderOptions() {}

	keyUpEvent() {}
	keyDownEvent() {}
	mouseMoveEvent() {}
}

Sprite.boxTemplate = `
	<div class="sprite-box"></div>
`;

class Group extends (Element, Focusable) {
	constructor(editor, info) {
		this.editor = editor;

		this.rect = null;
		this.sprites = [];

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

		/*var screen_pos = this.editor.active_project.imagePosToRelativePos(this.rect.x, this.rect.y);
		screen_pos.w = this.rect.w;
		screen_pos.h = this.rect.h;


		this.element.css(screen_pos.toCss());*/
		this.reposition();

		container.append(this.element);
	}

	reposition() {
		var screen_pos = this.rect.copy();
		screen_pos.adjustToZoom(this.editor.zoom);

		var adjusted_pos = this.editor.active_project.imagePosToRelativePos(screen_pos.x, screen_pos.y);
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
			<td><input type="text" name="group-name" placeholder="Group Name" /></td>
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
	Sprite: Sprite,
	Group: Group,
	Selection: Selection
}