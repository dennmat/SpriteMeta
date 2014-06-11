var Focusable = require('./base.js').Focusable;

var Utils = require('../utils.js');

var Mustache = require('mustache');

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

		//Selection Type Data
		this.gridSize = new Utils.Rect();

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

		var adjustedPos = this.editor.activeProject.imagePosToRelativePos(screenPos.x, screenPos.y);
		adjustedPos.w = screenPos.w;
		adjustedPos.h = screenPos.h;

		var imagePosition = this.editor.activeProject.getImagePosition();

		this.element.css(adjustedPos.toCss());

		this.repositionSubSelects();
	}

	setDimensions(w, h) {
		var tempRect = new Utils.Rect(this.rect.x, this.rect.y, w, h);
		
		//Gotta preserve x,y in this case. because it's essentially treated as a new position that isn't shifting an existing value
		var oldx = tempRect.x;
		var oldy = tempRect.y;
		tempRect.removeZoom(this.editor.zoom);
		tempRect.x = oldx;
		tempRect.y = oldy;


		this.rect = tempRect;

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

	clearSubSelects() {
		for (var s of this.subSelects) {
			s.element.remove();
			s.element = null;
			s.rect = null;
		}

		this.subSelects.length = 0;
	}

	getSelections() {
		if (this.subSelects.length == 0) {
			return [{rect: this.rect}];
		} else {
			var selections = [];
			var posRect = this.rect.copy();
			posRect.w = 0;
			posRect.h = 0;
			for (var sub of this.subSelects) {
				selections.push({
					rect: sub.rect.copy().add(posRect)
				});
			}

			return selections;
		}
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
		this.gridSize.w = cellWidth;
		this.gridSize.h = cellHeight;

		Selection.optionsElement.find('input[name="selection-grid-width"]').val(this.gridSize.w);
		Selection.optionsElement.find('input[name="selection-grid-height"]').val(this.gridSize.h);
	}

	resizeGrid(cw, ch) {
		this.gridSize.w = cw;
		this.gridSize.h = ch;

		var numCols = Math.floor(this.rect.w/cw);
		var numRows = Math.floor(this.rect.h/ch);

		this.clearSubSelects();

		for (var r = 0; r < numRows; r++) {
			var y = r * ch;
			for (var c = 0; c < numCols; c++) {
				var x = c * cw;
				this.addSubSelect(new Utils.Rect(x, y, cw, ch));
			}
		}

		this.reposition();
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
			<td>Width: </td><td><input name="selection-grid-width" placeholder="Cell Width" type="text" /></td>
		</tr>
		<tr class="selection-grid-options">
			<td>Height: </td><td><input name="selection-grid-height" placeholder="Cell Height" type="text" /></td>
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
		Selection.optionsElement = $(Mustache.to_html(Selection.optionsHtml, {}));

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

Selection.keyCoolDown = null;
Selection.keyUpCallBack = null;

//Grid Mode Functions
Selection.GridWidthKeyUp = function(e) {
	var container = Selection.optionsElement;
	var nw = parseInt(container.find('input[name="selection-grid-width"]').val());
	var nh = Selection.boundSelection.gridSize.h;

	if (e.keyCode === Utils.KeyCodes.UP) {
		nw += 1;
		container.find('input[name="selection-grid-width"]').val(nw);
	} else if (e.keyCode === Utils.KeyCodes.DOWN) {
		nw -= 1;
		container.find('input[name="selection-grid-width"]').val(nw);
	}

	if (!isNaN(nw)) {
		Selection.boundSelection.resizeGrid(nw, nh);
	}
};

Selection.GridHeightKeyUp = function(e) {
	var container = Selection.optionsElement;
	var nh = parseInt(container.find('input[name="selection-grid-height"]').val());
	var nw = Selection.boundSelection.gridSize.w;

	if (e.keyCode === Utils.KeyCodes.UP) {
		nh += 1;
		container.find('input[name="selection-grid-height"]').val(nh);
	} else if (e.keyCode === Utils.KeyCodes.DOWN) {
		nh -= 1;
		container.find('input[name="selection-grid-height"]').val(nh);
	}
	
	if (!isNaN(nh)) {
		Selection.boundSelection.resizeGrid(nw, nh);
	}
};

//Would love to eventually rework all this
//Makes it so theres a timeout before attempting to render, make sure the user is done typing
//Might change to enter key validation
Selection.setUpKeyUpEvent = function(callback) {
	return (function() {
		return e => {
			if (Selection.keyCoolDown !== null) {
				clearTimeout(Selection.keyCoolDown);
			}
			
			Selection.keyCoolDown = setTimeout(function() { 
				callback(e);
				Selection.keyCoolDown = null;
				Selection.callback = null;
			}, 100);
		}
	})();
}


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

	//Grid Mode
	container.on('keyup', 'input[name="selection-grid-width"]', Selection.setUpKeyUpEvent(Selection.GridWidthKeyUp));
	container.on('keyup', 'input[name="selection-grid-height"]', Selection.setUpKeyUpEvent(Selection.GridHeightKeyUp));
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

module.exports = {
	Selection: Selection
};