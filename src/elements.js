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
		this.element.css({
			left: this.pos.x,
			top: this.pos.y
		});

		this.editor.getEditorContainer().append(this.element);
	}

	update(w, h) {
		this.pos.w = w;
		this.pos.h = h;

		this.element.css({
			width: w,
			height: h
		});
	}

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

class Sprite extends Element {
	constructor(editor, info) {
		this.editor = editor;
		this.rect = new Utils.Rect();

		if (info) {
			this.load(info);
		}
	}

	reposition() {

	}

	load(info) {

	}

	serialize() {

	}
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

		this.element.css(this.rect.toCss());

		container.append(this.element);
	}

	reposition() {

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
}

Group.boxTemplate = `
	<div class="group-box"></div>
`;

module.exports = {
	Sprite: Sprite,
	Group: Group,
	Selection: Selection
}