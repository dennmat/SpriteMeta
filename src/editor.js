var fs = require('fs');

var Mustache = require('Mustache');

var Utils = require('./utils.js');
var Project = require('./project.js');
var Elements = require('./elements');
var Tools = require('./tools.js');

//WTF
function Image() {
	return window.document.createElement("img");
}

class Editor {
	constructor(container, tab_manager) {
		this.tab_manager = tab_manager;

		this.projects = [];
		this.activeProject = null;

		this.container = container;

		this.zoom = 1;
		this.scrollInterval = null;

		this.dragging = false;
		this.dragInfo = null;

		this.selecting = false;
		this.selectionRegion = null;
		this.selection = null;

		//For multiple selection of sprites:
		this.selected = [];
		this.multiSelecting = false;

		this.mousePos = new Utils.Rect();

		this.tools = new Tools();

		this.focusedElement = null;

		this.image_object = null;

		this.element = null;
		this.build();
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

			this.updateStatus();

			this.delegate();
		});
	}

	updateStatus() {
		var right_side = this.element.find('.status-bar .right-side');

		right_side.text('Zoom: ' + parseInt(this.zoom*100).toString() + '%' + ' Mouse: (' + this.mousePos.x + ', ' + this.mousePos.y + ')');
	}

	hide() {
		this.element.hide();
	}

	show() {
		this.element.show();
	}

	//Return generic area for elements to exist
	getEditorContainer() {
		return this.element.find('.right-pane');
	}

	removeSelection() {
		this.selection.destroy();
		this.selection = null;

		this.tools.disableSelectionTools();
	}

	handleDrag(e) {
		var wasDragged = this.dragging;
		this.dragging = false;
		
		$(window).unbind("mousemove");

		if (!wasDragged || this.dragInfo === null) {
			return;
		}

		var deltaX = (e.pageX - this.dragInfo.x);
		var deltaY = (e.pageY - this.dragInfo.y);

		var current_pos = this.image_canvas.position();
		
		this.activeProject.setImagePosition(current_pos.left + deltaX, current_pos.top + deltaY);

		this.setPos(deltaX, deltaY);

		this.dragInfo = null;
	}

	handleSelection(e) {
		var wasSelecting = this.selecting;
		var info = this.activeProject.editorInfo;
		this.selecting = false;

		$(window).unbind("mousemove");

		if (!wasSelecting || this.selectionRegion === null) {
			return;
		}

		var container = this.getEditorContainer();
		var relative = container.offset();

		var adjustedRegion = this.selectionRegion.copy();
		adjustedRegion.adjustToZoom(this.zoom);

		var adjustedPos = this.activeProject.imagePosToRelativePos(adjustedRegion.x, adjustedRegion.y);
		adjustedPos.w = adjustedRegion.w;
		adjustedPos.h = adjustedRegion.h;

		var w = (e.pageX - relative.left) - adjustedPos.x;
		var h = ((e.pageY - relative.top) + container.get(0).scrollTop) - adjustedPos.y;

		w /= info.zoom;
		h /= info.zoom;

		w = Math.floor(w) + 1;
		h = Math.floor(h) + 1;

		this.selection.setDimensions(w, h);

		this.selectionRegion = null;
		this.selectionMade();
	}

	selectionMade() {
		Elements.Selection.updateOptions(this.selection);
		this.tools.enableSelectionTools();
	}

	focus(element, isMulti=false) {
		if (this.focusedElement !== null) {
			this.focusedElement.blur()
		}

		if (isMulti) {
			if (this.focusedElement !== null && this.focusedElement != element) {
				this.selected.push(this.focusedElement);
				this.focusedElement.element.addClass('focused');
				this.focusedElement = null;
			}

			this.multiSelecting = true;
			
			this.selected.push(element);

			element.element.addClass('focused');
			
			if (this.selected.length <= 2) {
				this.setOptions();
			} else {
				Editor.updateMultiSelectOptions(this);
			}
		} else {
			if (this.multiSelecting) {
				this.multiSelecting = false;

				for (var s of this.selected) {
					s.blur();
				}

				this.selected.length = 0;
			}

			this.focusedElement = element;
			this.focusedElement.receiveFocus();
			this.setOptions();
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

	clearOptions() {
		this.element.find('.tool-options').empty();
	}

	setOptions() {
		this.element.find('.tool-options').empty();
		
		if (this.focusedElement === null && !this.multiSelecting) {
			return;
		}

		if (this.multiSelecting) {
			this.element.find('.tool-options').append(Editor.getMultiSelectElement(this));
		} else {
			this.element.find('.tool-options').append(this.focusedElement.renderOptions());
		}
	}

	delegate() {
		/*$(window).on('keyup', e => {
			if (this.focusedElement === null) {
				return true;
			}

			var cnt = false;
			for (var kc in Utils.KeyCodes) {
				if (Utils.KeyCodes[kc] === e.keycode) {
					cnt = true;
					break;
				}
			}

			if (!cnt) {
				return true;
			}
			
			if (this.focusedElement.keyUpEvent(e)) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		});*/

		/*$(window).keydown(e => { e.preventDefault(); });*/

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

		this.element.on('mousedown', '.image-holder', e => {
			e.preventDefault();
			
			if (e.shiftKey) {

				$(window).mousemove(we => {
					we.preventDefault();

					this.dragging = true;
					this.dragInfo = {x: we.pageX, y: we.pageY};
					
					$(window).unbind("mousemove");
				});

			} else {

				$(window).mousemove(we => {
					we.preventDefault();

					if (this.selection !== null && !this.selecting) {
						return;
					}

					var container = this.getEditorContainer();
					var relative = container.offset();
					
					if (this.selecting) {
						var info = this.activeProject.editorInfo;
						var adjustedRegion = this.selectionRegion.copy();
						adjustedRegion.adjustToZoom(this.zoom);

						var adjustedPos = this.activeProject.imagePosToRelativePos(adjustedRegion.x, adjustedRegion.y);
						adjustedPos.w = adjustedRegion.w;
						adjustedPos.h = adjustedRegion.h;

						var w = (we.pageX - relative.left) - adjustedPos.x;
						var h = ((we.pageY - relative.top) + container.get(0).scrollTop) - adjustedPos.y;
						
						w /= info.zoom;
						h /= info.zoom;

						w = Math.floor(w) + 1;
						h = Math.floor(h) + 1;

						if (w > this.activeProject.baseDimensions.w) {
							w = this.activeProject.baseDimensions.w;
						}
						if (h > this.activeProject.baseDimensions.h) {
							h = this.activeProject.baseDimensions.h;
						}
						
						this.selection.setDimensions(w, h);
					} else {
						var info = this.activeProject.editorInfo;
						this.selecting = true;

						var x = parseInt((e.pageX - relative.left) / info.zoom) * info.zoom;
						var y = parseInt(((e.pageY - relative.top) + container.get(0).scrollTop) / info.zoom) * info.zoom;
						
						var region = new Utils.Rect(x, y);
						var adjustedPos = this.activeProject.relativePosToImagePos(region.x, region.y);
						
						adjustedPos.w = region.w;
						adjustedPos.h = region.h;

						adjustedPos.removeZoom(this.zoom);

						this.selectionRegion = adjustedPos;
						this.selection = new Elements.Selection(this, this.selectionRegion);
						
						this.focus(this.selection);
					}
				});

			}
		});
		
		this.element.on('mouseup', '.image-holder,.selection,.pointer', e => {
			e.preventDefault();
			
			if (this.dragging) {
				this.handleDrag(e);
			}
			if (this.selecting) {
				this.handleSelection(e);
			}
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

				this.setZoom(currentZoom);
				
				clearInterval(this.scrollInterval);
				this.updateStatus();
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

		$('body').on('mousemove', '.image-holder', e=> {
			var container = this.getEditorContainer();
			var relative = container.offset();
			var info = this.activeProject.editorInfo;
			
			var pointer = this.container.find('.pointer');
			var x = parseInt((e.pageX - relative.left) / info.zoom) * info.zoom;
			var y = parseInt(((e.pageY - relative.top) + container.get(0).scrollTop) / info.zoom) * info.zoom;

			this.mousePos.x = parseInt(x/info.zoom);
			this.mousePos.y = parseInt(y/info.zoom);

			pointer.css({
				left: x,
				top: y
			});

			this.updateStatus();
		});

		this.element.on('click', '.sprite-box', e => {
			//e.preventDefault();
			
			var spriteBox = $(e.target);

			var sprite = this.activeProject.getSpriteByUID(spriteBox.data('uid'));

			this.focus(sprite, e.ctrlKey);
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

		if (this.selection !== null) {
			this.selection.reposition();
		}

		this.activeProject.update();
	}

	setZoom(previousZoom) {
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

		if (this.selection !== null) { //Temporary
			this.selection.reposition();
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

		this.updateStatus();
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

		this.tab_manager.addEditorTab(this, proj, true);
	}

	openFile(path) {
		fs.readFile(path, (err, data) => {
			var file_data = JSON.parse(data);

			var proj = new Project(null, this, path);
			this.activeProject = proj;
			proj.load(file_data);
			this.reload();
			this.projects.push(proj);

			this.tab_manager.addEditorTab(this, proj, true);
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
			this.tab_manager.markTabDirty(project_id);
		} else {
			this.tab_manager.markTabClean(project_id);
		}
	}

	postSave() {
		this.tab_manager.updateTabName(this.activeProject.id, this.activeProject.name);
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

		for (var sprite of editor.selected) {
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

		for (var sprite of editor.selected) {
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

		for (var sprite of editor.selected) {
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

		for (var sprite of editor.selected) {
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
	var element = Editor.MultiSelectElement;

	element.find('.selected-sprites-count').text(editor.selected.length);

	var ul = element.find('.currently-selected-sprites');
	ul.empty();

	for (var sprite of editor.selected) {
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