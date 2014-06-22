var fs = require('fs');

var Mustache = require('mustache');

var Utils = require('./utils.js');

var Project = require('./project.js');

var Elements = require('./elements');
var Tools = require('./tools.js');

var SelectionController = require('./selectioncontroller.js').Controller;
var SpriteSelector = require('./selectioncontroller.js').SpriteSelector;

var StatusBarController = require('./statusbar.js');

function Image() {
	return window.document.createElement("img");
}

class Editor {
	constructor(container, tabManager) {
		this.tabManager = tabManager;

		this.projects = [];
		this.activeProject = null;

		this.container = container;

		this.zoom = 1;
		this.scrollInterval = null;

		this.tools = new Tools();

		this.focusedElement = null;

		this.image_object = null;

		this.element = null;
		this.build();

		this.statusBar = new StatusBarController(this);
		this.selectionController = new SelectionController(this, Elements.Selection, {
			container: this.getEditorContainer(),
			parent: this.getEditorContainer()
		});
		this.spriteSelector = new SpriteSelector(this, {
			parent: this.getEditorContainer()
		});
	}

	build() {
		this.element = $('<div></div>').load('editor.html', () => {
			this.blank_element = this.element.find('.blank');
			this.image_holder = this.element.find('.image-holder');
			this.image_canvas = this.image_holder.find('.image-canvas');
			this.image_element = this.image_holder.find('img');

			if (this.activeProject === null) {
				this.image_holder.hide();
				this.blank_element.show();
			}

			//Build Tools Section
			this.tools.renderToolsTo(this.element.find('.left-pane .tools-container'));

			this.element.hide();
			this.container.append(this.element);

			this.statusBar.editorLoaded();
			this.statusBar.updateStatus();

			this.selectionController.editorLoaded();
			this.spriteSelector.editorLoaded();

			this.delegate();
		});
	}

	hide() {
		this.element.hide();
	}

	show() {
		this.element.show();
	}

	//Return generic area for elements to exist in
	getEditorContainer() {
		return this.element.find('.right-pane');
	}

	removeSelection() {
		this.selectionController.destroy();
		this.selection = null;

		this.tools.disableSelectionTools();
	}

	hasNewSelection(selection) {} 

	selectionMade(selection) {
		Elements.Selection.updateOptions(selection);
		this.tools.enableSelectionTools();
		this.setOptions();
	}

	selectionUpdate() {
		this.setOptions();
	}

	focus(element, isMulti=false) {
		if (this.focusedElement !== null) {
			this.focusedElement.blur()
		}
	}

	clearFocus() {
		if (this.focusedElement === null) {
			return;
		}

		this.focusedElement.blur();
		this.focusedElement = null;

		this.setOptions();
	}

	clearSelections() {
		var cleared = false;

		if (this.selectionController.hasSelection()) {
			cleared = true;
			this.selectionController.clearSelection();
		} else if (this.spriteSelector.hasSelection() || this.spriteSelector.hasMultiSelection()) {
			cleared = true;
			this.spriteSelector.clearSelection();
		}

		return cleared;
	}

	clearOptions() {
		this.element.find('.tool-options').empty();
	}

	setOptions() {
		this.clearOptions();

		if (this.focusedElement === null && !(this.spriteSelector.hasSelection() || this.spriteSelector.hasMultiSelection() || this.selectionController.hasSelection())) {
			return;
		}

		
		if (this.spriteSelector.hasMultiSelection()) {
			this.element.find('.tool-options').append(Editor.getMultiSelectElement(this));
		} else {
			if (this.selectionController.hasSelection()) {
				this.element.find('.tool-options').append(this.selectionController.selection.renderOptions());
			} else {
				this.element.find('.tool-options').append(this.spriteSelector.selected[0].renderOptions());
			}
		}
	}

	delegate() {
		this.element.on('click', '.tools-container a', e => {
			e.preventDefault();

			this.tools.toolEvent($(e.target), this);
		});

		this.element.on('click', '.editor-save-spriter', e => {
			e.preventDefault();
			this.saveFile();
		});

		this.element.on('click', '.editor-export-spriter', e => {
			e.preventDefault();
			this.exportProject();
		});

		this.element.on('click', '.editor-load-spritesheet', e => {
			e.preventDefault();
			Utils.openDialog(d => {
				var path = $(d.target).val();

				this.activeProject.path = path;
				this.resetImage();
			}, '.jpg, .jpeg, .png, .gif, .bmp');
		});
		
		this.element.on('mousewheel', '.right-pane', e => {
			if (!e.altKey) {
				return true;
			}

			e.preventDefault();
			e.stopPropagation();

			clearInterval(this.scrollInterval); //Reset the interval

			this.scrollInterval = setInterval(() => { //We don't want to fire this 20x for one physical scroll
				var wd = e.originalEvent.wheelDelta;

				var currentZoom = this.zoom;

				if (wd < 0) { //Down
					this.zoom -= Math.abs(wd)/1000;
				} else { //Up
					this.zoom += Math.abs(wd)/1000;
				}

				if (this.zoom <= 0) {
					this.zoom = 0.1;
				} else if (this.zoom > 10) {
					this.zoom = 10;
				}

				this.zoom = parseFloat(this.zoom.toFixed(2));

				this.activeProject.editorInfo.zoom = this.zoom;

				this.setZoom();
				
				clearInterval(this.scrollInterval);
				this.statusBar.updateStatus();
			}, 50);

			return false;
		});

		$('body').on('click', '#sp-newSpriter', e => {
			e.preventDefault();

			this.newFile();
		});

		$('body').on('click', '#sp-openSpriter', e => {
			e.preventDefault();

			Utils.openDialog(d => {
				this.openFile($(d.target).val());
			});
		});
	}

	loadedImage() {
		if (this.activeProject !== null) {
			this.activeProject.setDimensions(
				new Utils.Rect(
					0, 0, 
					this.image_object.naturalWidth, 
					this.image_object.naturalHeight
				)
			);
		}
	}

	setPos(deltaX, deltaY) {
		var info = this.activeProject.editorInfo;

		this.image_canvas.css({
			left: info.pos.x.toString() + 'px',
			top: info.pos.y.toString() + 'px'
		});

		if (this.selectionController.selection !== null) {
			this.selectionController.selection.reposition();
		}

		this.activeProject.update();
	}

	setZoom(newZoom) {
		if (newZoom !== undefined) {
			this.zoom = newZoom;
			this.activeProject.editorInfo.zoom = this.zoom;
		}

		var info = this.activeProject.editorInfo;

		var newWidth = this.activeProject.baseDimensions.w * info.zoom;
		var newHeight = this.activeProject.baseDimensions.h * info.zoom;

		this.image_canvas.attr('width', newWidth);
		this.image_canvas.attr('height', newHeight);

		this.element.find('.pointer').css({
			width: info.zoom,
			height: info.zoom
		});

		if (this.image_object !== null) {
			var ctx = this.image_canvas[0].getContext("2d");
			ctx.imageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.drawImage(this.image_object, 0, 0, newWidth, newHeight);
		}

		if (this.selectionController.selection !== null) { //FIXME: short term fix
			this.selectionController.selection.reposition();
		}

		this.activeProject.update();
	}

	reload() {
		if (this.activeProject == null) {
			return;
		}

		if (this.activeProject.path === null || this.activeProject.path.length === 0) {
			this.image_holder.hide();
			this.blank_element.show();
		} else {
			this.resetImage();
		}

		this.zoom = this.activeProject.editorInfo.zoom;

		this.setPos();
		this.setZoom();

		this.activeProject.update();

		this.statusBar.updateStatus();
	}

	getProjectById(id) {
		var project;
		for (project of this.projects) {
			if (project.id === id) {
				return project;
			}
		}
		return null;
	}

	switchToProject(id) {
		var proj = this.getProjectById(id);

		this.activeProject = proj;
		this.reload();
	}

	resetImage() {
		this.image_object = Image();
		this.image_object.onload = () => {
			this.image_canvas.attr('width', this.image_object.naturalWidth);
			this.image_canvas.attr('height', this.image_object.naturalHeight);

			this.loadedImage();
			this.setZoom();
		};
		this.image_object.src = this.activeProject.path;

		this.image_holder.show();
		this.blank_element.hide();
	}

	newFile() {
		var proj = new Project(undefined, this);
		this.projects.push(proj);

		this.tabManager.addEditorTab(this, proj, true);
	}

	openFile(path) {
		fs.readFile(path, (err, data) => {
			var file_data = JSON.parse(data);

			var proj = new Project(null, this, path);
			this.activeProject = proj;
			proj.load(file_data);
			this.reload();
			this.projects.push(proj);

			this.tabManager.addEditorTab(this, proj, true);
		});
	}

	saveFile(save_as=false) {
		if (this.activeProject === null) {
			return;
		}

		if (this.activeProject.spriter_path !== null && !save_as) {
			this.activeProject.saveProject();
		} else {
			Utils.saveDialog(e => {
				var destination = $(e.target).val();

				this.activeProject.saveProject(destination, this.postSave.bind(this));
			});
		}
	}

	exportProject() {
		if (this.activeProject === null) {
			return;
		}

		Utils.saveDialog(e => {
			var destination = $(e.target).val();

			this.activeProject.exportProject(destination);
		}, '.json');
	}

	updateDirty(project_id) {
		var proj = this.getProjectById(project_id);

		if (proj.dirty) {
			this.tabManager.markTabDirty(project_id);
		} else {
			this.tabManager.markTabClean(project_id);
		}
	}

	postSave() {
		this.tabManager.updateTabName(this.activeProject.id, this.activeProject.name);
	}

	exportFile() {

	}
}

Editor.MultiSelectElement = null;

Editor.getMultiSelectElement = function(editor) {
	if (Editor.MultiSelectElement === null) {
		Editor.MultiSelectElement = $(Mustache.to_html(Editor.MultiSelectOptionsTemplate, {}));
	}

	var element = Editor.MultiSelectElement;

	element.on('click', '.mover-up', e => {
		var type = element.find('.mover-type').val();
		var delta = parseInt(element.find('.mover-amount').val()) * -1;

		for (var sprite of editor.spriteSelector.selected) {
			if (type == 'position') {
				sprite.alterPosition(delta, Utils.KeyCodes.UP);
			} else {
				sprite.alterSize(delta, Utils.KeyCodes.UP);
			}
		}
	});

	element.on('click', '.mover-down', e => {
		var type = element.find('.mover-type').val();
		var delta = parseInt(element.find('.mover-amount').val());

		for (var sprite of editor.spriteSelector.selected) {
			if (type == 'position') {
				sprite.alterPosition(delta, Utils.KeyCodes.DOWN);
			} else {
				sprite.alterSize(delta, Utils.KeyCodes.DOWN);
			}
		}
	});

	element.on('click', '.mover-left', e => {
		var type = element.find('.mover-type').val();
		var delta = parseInt(element.find('.mover-amount').val()) * -1;

		for (var sprite of editor.spriteSelector.selected) {
			if (type == 'position') {
				sprite.alterPosition(delta, Utils.KeyCodes.LEFT);
			} else {
				sprite.alterSize(delta, Utils.KeyCodes.LEFT);
			}
		}
	});

	element.on('click', '.mover-right', e => {
		var type = element.find('.mover-type').val();
		var delta = parseInt(element.find('.mover-amount').val());

		for (var sprite of editor.spriteSelector.selected) {
			if (type == 'position') {
				sprite.alterPosition(delta, Utils.KeyCodes.RIGHT);
			} else {
				sprite.alterSize(delta, Utils.KeyCodes.RIGHT);
			}
		}
	});


	Editor.updateMultiSelectOptions(editor);

	return Editor.MultiSelectElement;
};

Editor.updateMultiSelectOptions = function(editor) {
	if (Editor.MultiSelectElement !== null) {
		var element = Editor.MultiSelectElement;
	} else {
		var element = Editor.getMultiSelectElement(editor);
	}

	element.find('.selected-sprites-count').text(editor.spriteSelector.selected.length);

	var ul = element.find('.currently-selected-sprites');
	ul.empty();

	for (var sprite of editor.spriteSelector.selected) {
		ul.append(
			$('<li><\/li>', {text: sprite.name})
		);
	}
};

Editor.MultiSelectOptionsTemplate = `
<div class="selected-sprites-container">
	Selecting <span class="selected-sprites-count"></span> sprites. 
	<ul class="currently-selected-sprites">
	</ul>
	<table class="mover">
		<tr>
			<td colspan="3">
				<div class="title">
				Multi Selection Controller
				</div>
				<select class="mover-type">
					<option value="position" selected="selected">Position</option>
					<option value="size">Size</option>
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
			<td><input type="text" class="mover-amount" value="1" />px</td>
			<td><a href="#" class="button blue mover-right"><i class="icon-chevron-right"></i></a></td>
		</tr>
		<tr>
			<td>&nbsp;</td>
			<td><a href="#" class="button blue mover-down"><i class="icon-chevron-down"></i></a></td>
			<td>&nbsp;</td>
		</tr>
	</table>
</div>
`;

module.exports = Editor;
