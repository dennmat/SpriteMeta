var Utils = require('./utils.js');

class Animation {
	constructor(editor, project) {
		this.editor = editor;
		this.project = project;

		this.largestWidth = 0;
		this.largestHeight = 0;

		this.frames = []; //aka sprites, order matters

		this.name = '';

		//For rendering the animation
		this.frame = 0;
		this.sinceLastFrame = 0;
		this.loop = false;
		this.playInterval = null;

		this.uid = Animation.UID_COUNTER++;
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
}

Animation.UID_COUNTER = 0;

class AnimationTab {
	constructor(toolBar, editor) {
		this.toolBar = toolBar;
		this.editor = editor;

		this.animations = [];

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

		//TODO For loading from file
	}

	addAnimation() {
		this.animations.push({

		});
	}

	removeAnimation() {

	}

	serialize() {

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