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

		var adjusted_pos = this.editor.active_project.imagePosToRelativePos(screen_pos.x, screen_pos.y);
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

		this.reposition();

		container.append(this.element);
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

Sprite.optionsHtml = `
	<table>
		<tr>
			<td colspan="3">Sprite Test</td>
		</tr>
		<tr>
			<td></td>
			<td></td>
			<td></td>
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
};

Sprite.updateOptions = function(sprite) {
	if (Sprite.optionsElement === null) {
		Sprite.getOptionsElement();
	}

	Sprite.bindTo(sprite);
};

module.exports = {
	Sprite: Sprite
};