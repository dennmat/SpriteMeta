var Utils = require('./utils.js');

var Animation = require('./elements').Animation;

class AnimationTab {
	constructor(toolBar, editor) {
		this.toolBar = toolBar;
		this.editor = editor;

		//This should be changed when projects changed and eventually moved to storage on the project and 
		//this.animations = null;

		this.selected = null;
	}

	editorLoaded() {
		this.element = this.toolBar.element.find('.animation-tab').eq(0);

		this.element.on('click', '.existing-animations li', e => {
			e.preventDefault();
		});

		this.element.on('click', '.new-animation', e => {
			e.preventDefault();

			this.addAnimation();
		});

		this.element.on('click', '.frame-selector li', e => {
			e.preventDefault();

			this.ui.frames.find('.selected').removeClass('selected');

			$(e.target).addClass('selected');

			this.selectFrame($(e.target).data('frame-index'));
		});

		this.element.on('click', '.animation-preview', e => {
			e.preventDefault();

			var project = this.editor.activeProject;
			var pf = this.ui.previewFrame;

			console.log("PROJ PATh", project.path, project.path.replace('\\', '/'));

			pf.css({
				'background-image': 'url(' + project.path.replace(/\\/g, '/') + ')',
				'background-repeat': 'none'
			});

			this.selected.play(this.ui.previewFrame);
		});

		this.ui = {
			options: this.toolBar.element.find('.selected-animation'),
			existing: this.toolBar.element.find('.existing-animations'),
			existingAnimations: this.toolBar.element.find('.existing-animations .animation-selector'),
			frames: this.toolBar.element.find('.selected-animation .frame-selector'),
			frameOptions: this.toolBar.element.find('.frame-options'),
			previewAnimation: this.toolBar.element.find('.animation-preview'),
			previewFrame: this.toolBar.element.find('.preview-frame')
		};
	}

	selectFrame(index) {
		var frame = this.selected.frames[parseInt(index)];

		this.ui.frameOptions.find('.frame-duration').val(frame.duration);
		this.ui.frameOptions.find('.frame-sprite-name').text(frame.sprite.name);

		this.ui.frameOptions.show();
	}

	loadAnimations() {
		var project = this.editor.activeProject;
		this.animations = project.animations;
	}

	addAnimation(animation=null) {
		if (animation === null) {
			animation = new Animation(this.editor);	
		}

		this.editor.activeProject.addAnimation(animation);

		this.refreshAnimationList();

		this.selected = animation;
		this.select();
	}

	refreshAnimationList() {
		var project = this.editor.activeProject;

		this.ui.existingAnimations.empty();

		for (var animation of project.animations) {
			this.ui.existingAnimations.append(
				$('<li data-id="' + animation.id + '">' + animation.name + '</li>')
			);
		}
	}

	refreshSelected() {
		var project = this.editor.activeProject;

		this.ui.frames.empty();

		var frameIndex = 0;
		for (var frame of this.selected.frames) {
			this.ui.frames.append(
				$('<li data-frame-index="' + frameIndex++ + '">' + frame.sprite.name + '</li>')
			);
		}

		if (this.selected.frames.length > 0) {
			this.ui.previewAnimation.show();
		} else {
			this.ui.previewAnimation.hide();
		}
	}

	spriteSelected(sprite) {
		if (this.selected === null) {
			console.log("Shouldn't get here debug time.");
			return;
		}

		this.selected.addFrame(sprite);
		this.refreshSelected();
	}

	select() {
		if (this.selected === null) {
			return;
		}

		var sprites = [];

		for (var frame of this.selected.frames) {
			sprites.push(frame.sprite);
		}

		this.editor.spriteSelector.selectSprites(sprites);

		this.editor.spriteSelector.addWatcher('animation', this);

		//Set Options TODO
		this.ui.options.find('.animation-name').val(this.selected.name);

		this.ui.existing.hide();
		this.ui.options.show();
	}

	deselect() {
		this.editor.spriteSelector.removeWatcher('animation');
		this.editor.clearSelections();

		this.ui.options.hide();
		this.ui.existing.show();
	}

	removeAnimation() {

	}

	selectAnimation(uid) {
		var project = this.editor.activeProject;
		this.selected = project.getAnimationById(uid);

		this.select();
	}

	clearSelection() {

	}
}

class Toolbar {
	constructor(editor) {
		this.editor = editor;

		this.animationTab = new AnimationTab(this, editor);
	}

	editorLoaded() {
		this.element = this.editor.element.find('.left-pane');
		this.tabsElement = this.element.find('ul.editor-tabs');
		this.tabs = {};

		this.initializeTabs();

		this.animationTab.editorLoaded();
	}

	switchToTab(tabId) {
		for (var k in this.tabs) {
			if (k == tabId) {
				this.tabs[k].body.show();
				this.tabs[k].tab.addClass('selected');
			} else {
				this.tabs[k].body.hide();
				this.tabs[k].tab.removeClass('selected');
			}
		}
	}

	initializeTabs() {
		this.tabsElement.find('li').each((i, e) => {
			this.tabs[$(e).data('tab')] = {
				tab: $(e),
				body: this.element.find('.tab-body[data-tab="' + $(e).data('tab') + '"]').eq(0)
			};
		});

		for (var k in this.tabs) {
			this.tabs[k].tab.on('click', e => {
				this.switchToTab($(e.target).data('tab'));
			});
		}
	}

	delegate() {

	}
}

module.exports = Toolbar;