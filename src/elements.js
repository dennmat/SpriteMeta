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

		this.rect = (rect !== undefined)? rect : new Utils.Rect();

		this.element = null;

		//Focusable
		this.hasFocus = false;

		this.selectionMode = Selection.Modes.None;

		this.subSelects = [];

		this.build();
	}

	build() {
		this.element = $(Mustache.to_html(Selection.template));
		
		this.reposition();

		this.editor.getEditorContainer().append(this.element);
	}

	setMode(newMode) {
		this.selectionMode = newMode;

		var optionsElement = Selection.getOptionsElement();

		optionsElement.find('.selection-modes').hide();

		switch(newMode) {
			case Selection.Modes.Grid: 
				this.initGridMode();
				optionsElement.find('.selection-grid-options').show();
			break;
			case Selection.Modes.Auto:
				this.initAutoMode();
				optionsElement.find('.selection-auto-options').show();
			break;
			case Selection.Modes.Side:
				this.initSideMode();
				optionsElement.find('.selection-side-options').show();
			break;
		}

		this.reposition();
	}

	/*move(deltaX, deltaY) {
		this.rect.x += deltaX;
		this.rect.y += deltaY;

		this.update();
	}*/

	reposition() {
		var screenPos = this.rect.copy();
		screenPos.adjustToZoom(this.editor.zoom);

		var adjustedPos = this.editor.active_project.imagePosToRelativePos(screenPos.x, screenPos.y);
		adjustedPos.w = screenPos.w;
		adjustedPos.h = screenPos.h;

		var imagePosition = this.editor.active_project.getImagePosition();

		this.element.css(adjustedPos.toCss());
		
		this.repositionSubSelects();
	}

	setDimensions(w, h) {
		var tempRect = new Utils.Rect(this.rect.x, this.rect.y, w, h);
		tempRect.removeZoom(this.editor.zoom);

		this.rect = tempRect;

		//console.log("SETTING DIMENSIONS", w, h, this.rect);

		this.reposition();
	}

	repositionSubSelects() {
		for (var sub of this.subSelects) {
			var zoomAdjust = sub.rect.copy();
			zoomAdjust.adjustToZoom(this.editor.zoom);

			sub.element.css(zoomAdjust.toCss());
		}
	}

	addSubSelect(subRect) {
		var ele = $(Mustache.to_html(Selection.subSelectTemplate));
		this.subSelects.push({
			rect: subRect,
			element: ele
		});

		ele.css(subRect.toCss());

		this.element.append(ele);
	}

	initGridMode() {
		/*
			Currently this function makes some assumptions:
				h <= 50: Single Row, cells are w/5 wide
				w <= 50: Single Column, cells are h/5 tall
				Or h <= 50 && w <= 50, single cell
			Hopefully I can find a better way to init this.
			Grid mode may also resize selection rect to fit perfect.
		*/

		var numCols = 1,
			cellWidth = 0,
			numRows = 1,
			cellHeight = 0;

		if (this.rect.h <= 50 && this.rect.w <= 50) {
			numCols = 1;
			numRows = 1;
			cellHeight = 50;
			cellWidth = 50;
		} else if (this.rect.h <= 50) {
			numRows = 1;
			cellHeight = 50;
			cellWidth = Math.floor(this.rect.w/5);
			numCols = Math.floor(this.rect.w/cellWidth);
		} else if (this.rect.w <= 50) {
			numCols = 1;
			cellWidth = 50;
			cellHeight = Math.floor(this.rect.h/5);
			numRows = Math.floor(this.rect.h/cellHeight);
		} else {
			cellWidth = Math.floor(this.rect.w/5);
			cellHeight = Math.floor(this.rect.h/5);
			numCols = Math.floor(this.rect.w/cellWidth);
			numRows = Math.floor(this.rect.h/cellHeight);
		}

		this.rect.w = cellWidth * numCols;
		this.rect.h = cellHeight * numRows;

		var cell_count = numCols * numRows;
		var on_row = 0,
			on_col = 0;

		if (cell_count > 1) {
			for (var i = 0; i < cell_count; i++) {
				//Add Subselects
				var x = on_col * cellWidth;

				if (x + cellWidth > this.rect.w) {
					on_row++;
					on_col = 0;
					x = 0;
				}

				var y = on_row * cellHeight;
				this.addSubSelect(new Utils.Rect(x, y, cellWidth, cellHeight));
				on_col++;
			}
		}
	}

	initAutoMode() {

	}

	initSideMode() {

	}

	keyUpEventGrid(dir, shiftDown) {
		var dirty = false;

		switch(dir) {
			case Utils.KeyCodes.UP:
				dirty = true;
			break;
			case Utils.KeyCodes.DOWN:
				dirty = true;
			break;
			case Utils.KeyCodes.LEFT:
				dirty = true;
			break;
			case Utils.KeyCodes.RIGHT:
				dirty = true;
			break;
		}

		return dirty;
	}

	keyUpEventAuto(dir, shiftDown) {

	}

	keyUpEventSide(dir, shiftDown) {

	}

	keyUpEventNone(dir, shiftDown) {
		var dirty = false;

		if (dir === Utils.KeyCodes.UP) {
			if (shiftDown) {
				this.rect.h -= 1;
			} else {
				this.rect.y -= 1;
			}
			dirty = true;
		} else if (dir === Utils.KeyCodes.DOWN) {
			if (shiftDown) {
				this.rect.h += 1;
			} else {
				this.rect.y += 1;
			}
			dirty = true;
		} else if (dir === Utils.KeyCodes.LEFT) {
			if (shiftDown) {
				this.rect.w -= 1;
			} else {
				this.rect.x -= 1;
			}
			dirty = true;
		} else if (dir === Utils.KeyCodes.RIGHT) {
			if (shiftDown) {
				this.rect.w += 1;
			} else {
				this.rect.x += 1;
			}
			dirty = true;
		}

		return dirty;
	}

	inBounds(x, y) {
		var pointRect = new Utils.Rect(x, y, 1, 1);
		return pointRect.hasIntersect(this.rect);
	}

	renderOptions() {
		return Selection.getOptionsElement();
	}

	keyUpEvent(e) {
		var _call = Selection.ModesKeyUp[this.selectionMode].bind(this);

		var dirty = _call(e.which, e.shiftKey);

		if (dirty) {
			this.reposition();
		}

		return dirty;
	}

	keyDownEvent() {}
	mouseMoveEvent() {}

	destroy() {
		this.element.remove();
		this.pos = null;
	}
}

Selection.Modes = {
	None: 0,
	Grid: 1,
	Auto: 2,
	Side: 3
};

Selection.ModesKeyUp = {};
Selection.ModesKeyUp[Selection.Modes.None] = Selection.prototype.keyUpEventNone;
Selection.ModesKeyUp[Selection.Modes.Grid] = Selection.prototype.keyUpEventGrid;
Selection.ModesKeyUp[Selection.Modes.Auto] = Selection.prototype.keyUpEventAuto;
Selection.ModesKeyUp[Selection.Modes.Side] = Selection.prototype.keyUpEventSide;

Selection.template = `
<div class="selection"></div>
`;

Selection.optionsHtml = `
	<table>
		<tr class="selection-modes">
			<td><a href="#" class="button light selection-grid-mode"><i class="icon-th"></i>&nbsp;Grid Mode</a></td>
			<td><a href="#" class="button light selection-auto-mode"><i class="icon-reorder"></i>&nbsp;Auto Mode</a></td>
		</tr>
		<tr class="selection-modes">
			<td><a href="#" class="button light selection-side-mode"><i class="icon-th-list"></i>&nbsp;Side Mode</a></td>
			<td></td>
		</tr>
		<tr class="selection-grid-options">
			<td colspan="2">Selection - Grid Mode</td>
		</tr>
		<tr class="selection-grid-options">
			<td colspan="2"><input name="selection-grid-width" placeholder="Cell Width" type="text" /></td>
		</tr>
		<tr class="selection-grid-options">
			<td colspan="2"><input name="selection-grid-height" placeholder="Cell Height" type="text" /></td>
		</tr>
	</table>
`;
Selection.optionsElement = null;
Selection.boundSelection = null;

Selection.subSelectTemplate = `
	<div class="selection-sub-select">
	</div>
`;

Selection.getOptionsElement = function() {
	if (Selection.optionsElement === null) {
		Selection.optionsElement = $(Selection.optionsHtml);

		['grid', 'auto', 'side'].forEach(item => {
			Selection.optionsElement.find('.selection-' + item + '-options').hide();
		});

		Selection.delegate();
	}

	return Selection.optionsElement;
};

Selection.bindTo = function(selection) {
	Selection.boundSelection = selection;
};

Selection.delegate = function() {
	var container = Selection.optionsElement;

	container.on('click', '.selection-grid-mode', e => {
		Selection.boundSelection.setMode(Selection.Modes.Grid);
	});
	container.on('click', '.selection-auto-mode', e => {
		Selection.boundSelection.setMode(Selection.Modes.Auto);
	});
	container.on('click', '.selection-side-mode', e => {
		Selection.boundSelection.setMode(Selection.Modes.Side);
	});
};

Selection.updateOptions = function(selection) {
	Selection.bindTo(selection);

	if (Selection.optionsElement === null) {
		Selection.getOptionsElement();
	}

	Selection.optionsElement.find('.selection-modes').show();
	['grid', 'auto', 'side'].forEach(item => {
		Selection.optionsElement.find('.selection-' + item + '-options').hide();
	});
};

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
	Sprite: Sprite,
	Group: Group,
	Selection: Selection
}