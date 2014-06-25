var Utils = require('./utils.js');

var Animation = require('./elements').Animation;

class Animation {
	constructor(editor) {
		this.editor = editor;
		this.project = this.editor.activeProject;

		this.largestWidth = 0;
		this.largestHeight = 0;

		this.frames = []; //aka sprites, order matters

		this.name = '';

		//For rendering the animation
		this.frame = 0;
		this.sinceLastFrame = 0;
		this.loop = false;
		this.playInterval = null;

		this.id = utils.generateId();
	}

	addFrame(sprite, duration=500) {
		//Duration in ms

		if (sprite.w > this.largestWidth) {
			this.largestWidth = sprite.w;
		}

		if (sprite.h > this.largestHeight) {
			this.largestHeight = sprite.h;
		}

		this.frames.push({
			duration: duration,
			sprite: sprite
		});
	}

	play(renderTo) {
		renderTo.css({
			'min-width': this.largestWidth + 'px',
			'min-height': this.largestHeight + 'px'
		});

		this.sinceLastFrame = Date.now();
		this.playInterval = setInterval($.proxy(this.tick, this), 10);
	}

	tick(renderTo) {
		if (this.frames[this.frame].duration >= Date.now() - this.sinceLastFrame) {
			this.sinceLastFrame = Date.now();
			this.frame++;

			if (this.frame == this.frames.length) {
				if (this.loop) {
					this.frame = 0; 
				} else {
					clearInterval(this.playInterval);
					this.playInterval = null;
					return;
				}
			}
			//render the frame
		}
	}

	serialize() {
		var frames = [];

		for (var frame of this.frames) {
			frames.push({
				duration: frame.duration,
				sprite: frame.sprite.id //TODO Figure something out for exporting
			});
		}

		return {
			frames: frames,
			name: this.name,
			id: this.id
		};
	}
}

class AnimationTab {
	constructor(toolBar, editor) {
		this.toolBar = toolBar;
		this.editor = editor;

		//This should be changed when projects changed and eventually moved to storage on the project and 
		this.animations = null;

		this.selected = null;
	}

	editorLoaded() {
		this.element = this.toolBar.element.find('.animation-tab').eq(0);

		this.element.on('click', '.existing-animations li', e => {
			e.preventDefault();
		});
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
	}

	removeAnimation() {

	}

	selectAnimation(uid) {

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