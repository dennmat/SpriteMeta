var Base = require('./base.js');

var Utils = require('../utils.js');

var Mustache = require('mustache');

class Sprite extends (Base.Element, Base.Focusable) {
	constructor(editor, info) {
		this.editor = editor;
		this.rect = null;

		if (info !== undefined) {
			this.load(info);
		}

		this.build();
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
		if (info.rect !== undefined) {
			this.rect = info.rect;
		} else {
			this.rect = new Utils.Rect();
		}
	}

	build() {
		var container = this.editor.getEditorContainer();

		this.element = $(Mustache.to_html(Sprite.boxTemplate, {}));

		this.uid = Sprite.uidCounter++;
		this.element.attr('data-uid', this.uid);

		this.reposition();

		container.append(this.element);
	}

	serialize() {

	}

	inBounds(x, y) {
		var pointRect = new Utils.Rect(x, y, 1, 1);
		return pointRect.hasIntersect(this.rect);
	}

	renderOptions() {
		Sprite.updateOptions(this);
		return Sprite.getOptionsElement();
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

Sprite.boxTemplate = `
	<div class="sprite-box"></div>
`;

Sprite.optionsHtml = `
	<table>
		<tr>
			<td>Left: </td>
			<td><input type="text" name="sprite-options-left" /></td>
		</tr>
		<tr>
			<td>Top: </td>
			<td><input type="text" name="sprite-options-top" /></td>
		</tr>
		<tr>
			<td>Width: </td>
			<td><input type="text" name="sprite-options-width" /></td>
		</tr>
		<tr>
			<td>Height: </td>
			<td><input type="text" name="sprite-options-height" /></td>
		</tr>
	</table>
`;
Sprite.optionsElement = null;
Sprite.boundSprite = null;

Sprite.getOptionsElement = function() {
	if (Sprite.optionsElement === null) {
		Sprite.optionsElement = $(Sprite.optionsHtml);
		Sprite.delegate();
	}

	return Sprite.optionsElement;
};

Sprite.bindTo = function(sprite) {
	Sprite.boundSprite = sprite;
};

Sprite.delegate = function() {
	var container = Sprite.optionsElement;

	//container.on('keyup', '.sprite-options-width', e => {

	//});

	//container.on('keyup', '.sprite-options-height', e => {

	//});

	container.on('keyup', 'input[name="sprite-options-left"]', e => {
		var sprite = Sprite.boundSprite;

		var newX = parseInt($(e.target).val());

		if (!isNaN(newX)) {
			sprite.rect.x = newX;
		}
		
		sprite.reposition();
	});

	container.on('keyup', 'input[name="sprite-options-top"]', e => {
		var sprite = Sprite.boundSprite;

		var newY = parseInt($(e.target).val());

		if (!isNaN(newY)) {
			sprite.rect.y = newY;
		}

		sprite.reposition();
	});
	
	container.on('keyup', 'input[name="sprite-options-width"]', e => {
		var sprite = Sprite.boundSprite;

		var newW = parseInt($(e.target).val());

		if (!isNaN(newW)) {
			sprite.rect.w = newW;
		}

		sprite.reposition();
	});

	container.on('keyup', 'input[name="sprite-options-height"]', e => {
		var sprite = Sprite.boundSprite;

		var newH = parseInt($(e.target).val());

		if (!isNaN(newH)) {
			sprite.rect.h = newH;
		}

		sprite.reposition();
	});
};

Sprite.updateOptions = function(sprite) {
	if (Sprite.optionsElement === null) {
		Sprite.getOptionsElement();
	}

	var element = Sprite.optionsElement;

	element.find('input[name="sprite-options-left"]').val(sprite.rect.x);
	element.find('input[name="sprite-options-top"]').val(sprite.rect.y);
	element.find('input[name="sprite-options-width"]').val(sprite.rect.w);
	element.find('input[name="sprite-options-height"]').val(sprite.rect.h);

	Sprite.bindTo(sprite);
};

Sprite.uidCounter = 0;

module.exports = {
	Sprite: Sprite
};