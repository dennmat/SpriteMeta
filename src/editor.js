var fs = require('fs');

var Utils = require('../c/utils.js');
var Project = require('../c/project.js');
var Elements = require('../c/elements.js');
var Tools = require('../c/tools.js');

class Editor {
	constructor(container, tab_manager) {
		this.tab_manager = tab_manager;

		this.projects = [];
		this.active_project = null;

		this.container = container;

		this.zoom = 1;
		this.scrollInterval = null;

		this.dragging = false;
		this.dragInfo = null;

		this.selecting = false;
		this.selectionRegion = null;
		this.selection = null;

		this.tools = new Tools();

		this.focusedElement = null;

		this.element = null;
		this.build();
	}

	build() {
		this.element = $('<div></div>').load('editor.html', () => {
			this.blank_element = this.element.find('.blank');
			this.image_holder = this.element.find('.image-holder');
			this.image_element = this.image_holder.find('img');

			if (this.active_project === null) {
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

		right_side.text('Zoom: ' + parseInt(this.zoom*100).toString() + '%');
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

		var current_pos = this.image_element.position();
		
		this.active_project.setImagePosition(current_pos.left + deltaX, current_pos.top + deltaY);

		this.setPos(deltaX, deltaY);

		this.dragInfo = null;
	}

	handleSelection(e) {
		var wasSelecting = this.selecting;
		this.selecting = false;

		$(window).unbind("mousemove");

		if (!wasSelecting || this.selectionRegion === null) {
			return;
		}

		var relative = this.getEditorContainer().offset();

		var adjustedRegion = this.selectionRegion.copy();
		adjustedRegion.adjustToZoom(this.zoom);

		var adjustedPos = this.active_project.imagePosToRelativePos(adjustedRegion.x, adjustedRegion.y);
		adjustedPos.w = adjustedRegion.w;
		adjustedPos.h = adjustedRegion.h;


		var w = (e.pageX - relative.left) - adjustedPos.x;
		var h = (e.pageY - relative.top) - adjustedPos.y;

		this.selection.setDimensions(w, h);

		this.selectionRegion = null;
		this.selectionMade();
	}

	selectionMade() {
		this.tools.enableSelectionTools();
	}

	focus(element) {
		if (this.focusedElement !== null) {
			this.focusedElement.blur()
		}

		this.focusedElement = element;
		this.focusedElement.receiveFocus();

		this.setOptions();
	}

	clearOptions() {
		this.element.find('.tool-options').empty();
	}

	setOptions() {
		if (this.focusedElement === null) {
			return;
		}

		this.element.find('.tool-options').append(this.focusedElement.renderOptions());
	}

	delegate() {
		$(window).on('keyup', e => {
			if (this.focusedElement === null) {
				return true;
			}
			
			if (this.focusedElement.keyUpEvent(e)) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		});

		$(window).keydown(e => { e.preventDefault(); });

		this.element.on('click', '.tools-container a', e => {
			e.preventDefault();

			this.tools.toolEvent($(e.target), this);
		});

		this.element.on('click', '.editor-save-spriter', e => {
			e.preventDefault();
			this.saveFile();
		});

		this.element.on('click', '.editor-load-spritesheet', e => {
			e.preventDefault();
			Utils.openDialog(d => {
				var path = $(d.target).val();

				this.active_project.path = path;
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

					var relative = this.getEditorContainer().offset();
					
					if (this.selecting) {
						var adjustedRegion = this.selectionRegion.copy();
						adjustedRegion.adjustToZoom(this.zoom);

						var adjustedPos = this.active_project.imagePosToRelativePos(adjustedRegion.x, adjustedRegion.y);
						adjustedPos.w = adjustedRegion.w;
						adjustedPos.h = adjustedRegion.h;

						var w = (we.pageX - relative.left) - adjustedPos.x;
						var h = (we.pageY - relative.top) - adjustedPos.y;

						this.selection.setDimensions(w, h);
					} else {
						this.selecting = true;
						var region = new Utils.Rect(e.pageX - relative.left, e.pageY - relative.top);

						var adjustedPos = this.active_project.relativePosToImagePos(region.x, region.y);
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
		
		this.element.on('mouseup', '.image-holder', e => {
			e.preventDefault();

			if (this.dragging) {
				this.handleDrag(e);
			} else if (this.selecting) {
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
					this.zoom -= Math.abs(wd)/500;
				} else { //Up
					this.zoom += Math.abs(wd)/500;
				}

				if (this.zoom <= 0) {
					this.zoom = 0.1;
				} else if (this.zoom > 5) {
					this.zoom = 5;
				}

				this.zoom = parseFloat(this.zoom.toFixed(2));

				this.active_project.editorInfo.zoom = this.zoom;

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

	}

	loadedImage() {
		if (this.active_project !== null) {
			this.active_project.setDimensions(
				new Utils.Rect(
					0, 0, 
					this.image_element[0].naturalWidth, 
					this.image_element[0].naturalHeight
				)
			);
		}
	}

	setPos(deltaX, deltaY) {
		var info = this.active_project.editorInfo;

		this.image_element.css({
			left: info.pos.x.toString() + 'px',
			top: info.pos.y.toString() + 'px'
		});

		if (this.selection !== null) {
			this.selection.reposition();
		}

		this.active_project.update();
	}

	setZoom(previousZoom) {
		var info = this.active_project.editorInfo;

		var newWidth = this.active_project.baseDimensions.w * info.zoom;
		var newHeight = this.active_project.baseDimensions.h * info.zoom;

		this.image_element.css({
			width: newWidth.toString() + 'px',
			height: newHeight.toString() + 'px'
		});

		if (this.selection !== null) { //Temporary
			this.selection.reposition();
		}

		this.active_project.update();
	}

	reload() {
		if (this.active_project == null) {
			return;
		}

		if (this.active_project.path === null || this.active_project.path.length === 0) {
			this.image_holder.hide();
			this.blank_element.show();
		} else {
			this.resetImage();
		}

		this.zoom = this.active_project.editorInfo.zoom;

		this.setPos();
		this.setZoom();

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

		this.active_project = proj;
		this.reload();
	}

	resetImage() {
		var newImg = $('<img>').one("load", e => {
			this.loadedImage();
		}).attr('src', this.active_project.path);

		this.image_element.remove();
		this.image_element = null;

		this.image_element = newImg;
		this.image_element.appendTo(this.image_holder);

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

			var proj = new Project(file_data, this, path);
			this.projects.push(proj);

			this.tab_manager.addEditorTab(this, proj, true);
		});
	}

	saveFile(save_as=false) {
		if (this.active_project === null) {
			return;
		}

		if (this.active_project.spriter_path !== null && !save_as) {
			this.active_project.saveProject();
		} else {
			Utils.saveDialog(e => {
				var destination = $(e.target).val();

				this.active_project.saveProject(destination, this.postSave.bind(this));
			});
		}
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
		this.tab_manager.updateTabName(this.active_project.id, this.active_project.name);
	}

	exportFile() {

	}
}

module.exports = Editor;