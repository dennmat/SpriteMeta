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

		this.element = null;
		this.build();

		this.delegate();
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
	}

	handleDrag(e) {
		var wasDragged = this.dragging;
		this.dragging = false;
		
		$(window).unbind("mousemove");

		if (!wasDragged || this.dragInfo === null) {
			return;
		}

		var img_ele = this.image_element;
		var img_holder = this.image_holder;

		var delta_x = (e.pageX - this.dragInfo.x);
		var delta_y = (e.pageY - this.dragInfo.y);

		var current_pos = img_ele.position();
		
		this.active_project.editorInfo.pos.x = current_pos.left + delta_x;
		this.active_project.editorInfo.pos.y = current_pos.top + delta_y;

		this.setPos();

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

		var w = (e.pageX - relative.left) - this.selectionRegion.x;
		var h = (e.pageY - relative.top) - this.selectionRegion.y;

		this.selection.update(w, h);

		this.selectionRegion = null;
		this.selectionMade();
	}

	selectionMade() {
		this.tools.enableSelectionTools();
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
						var w = (we.pageX - relative.left) - this.selectionRegion.x;
						var h = (we.pageY - relative.top) - this.selectionRegion.y;

						this.selection.update(w, h);
					} else {
						this.selecting = true;
						this.selectionRegion = new Utils.Rect(e.pageX - relative.left, e.pageY - relative.top);
						this.selection = new Elements.Selection(this, this.selectionRegion);
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

				this.setZoom();
				
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

		this.element.on('load', '.image-holder img', e=> { //Refresh image data
			if (this.active_project !== null) {
				this.active_project.setDimensions(
					new Utils.Rect(
						0, 0, 
						this.image_element.width(), 
						this.image_element.height()
					)
				);
			}
		});
	}

	setPos() {
		var info = this.active_project.editorInfo;

		this.image_element.css({
			'left': info.pos.x.toString() + 'px',
			'top': info.pos.y.toString() + 'px'
		});
	}

	setZoom() {
		var info = this.active_project.editorInfo;

		this.image_element.css('width', parseInt(info.zoom * 100).toString() + '%');
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
		console.log("Reseting image to... ", this.active_project.path);
		this.image_element.attr('src', this.active_project.path);
			
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