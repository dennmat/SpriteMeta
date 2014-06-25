var Utils = require('./utils.js');

class SelectionInterface {
	updateSelection(rect) {}
	selectionMade() {}
	destroy() {}
}

//Handlers should be Classes that have a acceptSelection static method.
//acceptSelection get's passed the editor instance
//Should return an instance of that Class, that implements a destroy method.
//it should also support a updateSelection Method should accept a rect

class SelectionController {
	constructor(editor, handler, config) {
		this.eventNs = 'selectioncontroller';
		this.boundTo = [];

		this.editor = editor;

		this.defaults = {
			container: null,
			parent: null
		};

		this.options = $.extend({}, this.default, config);

		if (handler !== undefined) {
			this.handler = handler;
		}

		this.originalPoint = new Utils.Rect();
		this.rect = new Utils.Rect();

		this.selection = null;
		this.selecting = false;
	}

	setHandler(handler) {
		this.handler = handler;
	}

	clearSelection() {
		if (this.selection === null) {
			return;
		}

		this.selection.destroy();
		this.selection = null;

		this.rect = new Utils.Rect();

		this.editor.statusBar.setInfo('');
		this.editor.selectionUpdate();
	}

	rehook() {
		this.options.container = $(this.options.container.selector);
		this.options.parent = $(this.options.parent.selector);

		var eventMap = [
			['mouseup', this.mouseUp],
			['mousedown', this.mouseDown],
			//['mousemove', this.mouseMove], //Handled elsewhere
			['mousenter', this.mouseEnter],
			['mouseleave', this.mouseLeave]
		];

		this.options.container.off('.'+this.eventNs+'-mousemove');

		for (var eventData of eventMap) {
			this.options.container.on(eventData[0]+'.'+this.eventNs+'-'+eventData[0], $.proxy(eventData[1], this));
		}
	}

	editorLoaded() {
		this.rehook();
	}

	getProject() {
		return this.editor.activeProject;
	}

	updateRect(nx, ny) {
		var ox = this.originalPoint.x;
		var oy = this.originalPoint.y;

		this.rect.x = parseInt(Math.min(ox, nx));
		this.rect.y = parseInt(Math.min(oy, ny));
		this.rect.w = parseInt(Math.abs(ox - nx));
		this.rect.h = parseInt(Math.abs(oy - ny));

		if (this.selection !== null) {
			this.selection.updateSelection(this.rect);
		}

		this.editor.statusBar.setInfo('X: ' + this.rect.x + ' Y: ' + this.rect.y + ' W: ' + this.rect.w + ' H: ' + this.rect.h, 'fullscreen');
	}

	hasSelection() {
		return this.selection !== null;
	}

	mouseCoordsToImageCoords(me) {
		var project = this.getProject();

		var container = this.options.parent;
		var relative = container.offset();
		var zoom = this.editor.zoom;

		var deltaPoint = project.relativePosToImagePos(
			parseInt(((me.pageX - relative.left) + container.get(0).scrollLeft) / zoom) * zoom,
			parseInt(((me.pageY - relative.top) + container.get(0).scrollTop) / zoom) * zoom
		);

		deltaPoint.removeZoom(zoom);

		return deltaPoint;
	}

	mouseDown(e) {
		e.preventDefault();

		if (this.selection !== null) {
			this.clearSelection();
			return;
		}

		if ($('.sprite-box:hover').length > 0) {
			return;
		}
		
		if (this.editor.spriteSelector.hasMultiSelection() || this.editor.spriteSelector.hasSelection()) {
			this.editor.spriteSelector.clearSelection();
			this.editor.setOptions();
			return;
		}

		this.options.container.on('mousemove.'+this.eventNs+'-mousemove', me => {
			if (!this.selecting) { //Initiating
				this.selecting = true;
				this.selection = this.handler.acceptSelection(this.editor);
				this.editor.hasNewSelection(this.selection); //Let the editor know

				//set rect and initial position
				var mouseRect = this.mouseCoordsToImageCoords(me);
				this.originalPoint = mouseRect;
			} else {
				//update
				var mouseRect = this.mouseCoordsToImageCoords(me);
				this.updateRect(mouseRect.x, mouseRect.y);
			}
		});
	}

	mouseUp(e) {
		e.preventDefault();
		//e.stopPropagation();

		this.options.container.off('mousemove.'+this.eventNs+'-mousemove');

		if (this.selecting && this.selection !== null) {
			this.selection.selectionMade();
			this.selectionMade();
			this.editor.selectionMade(this.selection);
			this.selecting = false;
		}
	}

	mouseMove(e) {
	}

	mouseEnter(e) {
		if (this.selecting) {
			this.options.container.off('mousemove.'+this.eventNs+'-mousemove');
			this.selecting = false;
		}
	}

	mouseLeave(e) {
		if (this.selecting) {
			this.options.container.off('mousemove.'+this.eventNs+'-mousemove');
			this.clearSelection();
			this.selecting = false;
		}
	}

	selectionMade() {
		this.options.container.off('mousemove.'+this.eventNs+'-mousemove');
	}
}

class SpriteSelector {
	constructor(editor, config) {
		this.editor = editor;

		this.defaults = {
			parent: null
		};

		this.options = $.extend({}, this.defaults, config);

		this.selected = [];

	}

	editorLoaded() {
		this.options.parent = $(this.options.parent.selector);

		this.rehook();
	}

	rehook() {
		this.options.parent.on('click', '.sprite-box', $.proxy(this.spriteClick, this));
	}

	hasSelection() {
		return this.selected.length === 1;
	}

	hasMultiSelection() {
		return this.selected.length > 1;
	}

	spriteClick(e) {
		e.preventDefault();
		e.stopPropagation();

		if (this.editor.selectionController.hasSelection()) {
			this.editor.selectionController.clearSelection();
			return; 
		}

		var sprite = this.editor.activeProject.getSpriteByUID($(e.target).data('uid'));

		if (e.ctrlKey) {
			this.selected.push(sprite);
		} else {
			for (var s of this.selected) {
				s.blur();
			}

			this.selected.length = 0;
			this.selected = [sprite];
		}

		sprite.element.addClass('focused');

		this.editor.selectionUpdate();
	}

	clearSelection() {
		for (var s of this.selected) {
			s.blur();
		}
		this.selected.length = 0;

		this.editor.selectionUpdate();
	}
}

module.exports = {
	Inteface: SelectionInterface,
	Controller: SelectionController,
	SpriteSelector: SpriteSelector
};