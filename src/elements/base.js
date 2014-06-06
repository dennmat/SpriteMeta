var Utils = require('../utils.js');

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

class Element {
	reposition() {}
	load(info) {}
	serialize() {}
}

module.exports = {
	Focusable: Focusable,
	Element: Element
};