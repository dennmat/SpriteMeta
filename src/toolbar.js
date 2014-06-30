var Utils = require('./utils.js');
var UI = require('./ui');

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
		
		this.element.on('keyup', '.frame-duration', e => {
			var frame = this.getSelectedFrame();
			
			frame.duration = parseInt($(e.target).val());
		});
		
		this.element.on('keyup', '.animation-name', e => {
			var animation = this.selected;
			
			if (animation === null) {
				return;
			}
			
			animation.name = $(e.target).val();
			
			this.animationList.updateChoiceLabel(animation.id, animation.name);
		});

		this.element.on('click', '.animation-preview', e => {
			e.preventDefault();

			var project = this.editor.activeProject;
			var pf = this.ui.previewFrame;

			pf.css({
				'background-image': 'url(' + project.path.replace(/\\/g, '/') + ')',
				'background-repeat': 'none'
			});
			
			this.ui.previewFrame.show();
			
			this.ui.previewAnimation.hide();
			this.ui.stopAnimation.show();

			this.selected.play(this.ui.previewFrame);
		});
		
		this.element.on('click', '.stop-animation', e => {
			e.preventDefault();
			
			this.ui.stopAnimation.hide();
			this.ui.previewAnimation.show();
			
			this.ui.previewFrame.hide();
			
			this.selected.clearAnimation();
		});
		
		this.element.on('click', '.frame-delete', e => {
			e.preventDefault();
			
			this.existingFrames.removeChoice(this.existingFrames.val());
			this.selected.deleteFrame(this.existingFrames.val());
			
			this.ui.frameOptions.hide();
		});
		
		this.element.on('click', '.animation-done', e => {
			e.preventDefault();
			
			this.deselect();
		});
		//SO MUCH CLEANUP REQUIRED
		this.ui = {
			options: this.toolBar.element.find('.selected-animation'),
			existing: this.toolBar.element.find('.existing-animations'),
			existingAnimations: this.toolBar.element.find('.existing-animations .animation-selector'),
			animationOptions: this.toolBar.element.find('.selected-animation .animation-options'),
			//frames: this.toolBar.element.find('.selected-animation .frame-selector'),
			frameOptions: this.toolBar.element.find('.frame-options'),
			previewAnimation: this.toolBar.element.find('.animation-preview'),
			stopAnimation: this.toolBar.element.find('.stop-animation'),
			previewFrame: this.toolBar.element.find('.preview-frame')
		};
		
		this.existingFrames = new UI.ElementSelector({
			appendTo: this.ui.animationOptions.find('.existing-frames'),
			multiSelect: true,
			onChange: $.proxy(this.selectFrame, this)
		});
		
		this.animationList = new UI.ElementSelector({
			fromBase: this.ui.existingAnimations,
			onChange: $.proxy(this.selectAnimation, this)
		});
		
		this.bulkFrameControl = new UI.BulkMover({
			appendTo: this.ui.animationOptions.find('.multi-select'),
			types: {
				durationSet: {
					unit: 'ms',
					defaultAmount: 333,
					label: 'Set Duration',
					dirs: null
				},
				duration: {
					unit: 'ms',
					defaultAmount: 50,
					label: 'Duration',
					dirs: [Utils.KeyCodes.UP, Utils.KeyCodes.DOWN]
				}
			},
			callback: $.proxy(this.bulkMoverChange, this)
		});
	}
	
	bulkMoverChange(type, amount, direction) {
		var frames = this.getSelectedFrame(); //Assuming array as you shouldnt get here with no or single selection
		
		if (type === 'duration') {
			for (var frame of frames) {
				var delta = amount;
				
				if (direction === Utils.KeyCodes.DOWN) {
					delta *= -1;
				}
				
				frame.duration += delta;
			}
		} else if (type === 'durationSet') {
			for (var frame of frames) {
				frame.duration = parseInt(amount);
			}
		}
	}
	
	getSelectedFrame() {
		if ($.isArray(this.existingFrames.val())) {
			var selected = [];
			for (var frame of this.selected.frames) {
				if (this.existingFrames.val().indexOf(frame.sprite.id) > -1) {
					selected.push(frame);
				}
			}
			
			if (selected.length == 0) {
				return null;
			}
			
			return selected;
		} else {
			for (var frame of this.selected.frames) {
				if (frame.sprite.id == this.existingFrames.value) {
					return frame;
				}
			}
		}
		return null;
	}

	selectFrame(selector) {
		var frame = this.getSelectedFrame();
		
		if (frame === null) {
			return;
		}
		
		if ($.isArray(frame)) {
			this.ui.animationOptions.find('.multi-select').show();
			this.ui.animationOptions.find('.single-select').hide();
		} else {
		
			this.ui.frameOptions.find('.frame-duration').val(frame.duration);
			this.ui.frameOptions.find('.frame-sprite-name').text(frame.sprite.name);
			this.ui.animationOptions.find('.multi-select').hide();
			this.ui.animationOptions.find('.single-select').show();
			this.ui.frameOptions.show();
		}
	}

	loadAnimations() {
		var project = this.editor.activeProject;
		this.animations = project.animations;
		
		for (var animation of project.animations) {
			this.animationList.addChoice(animation.id, animation.name);
		}
	}

	addAnimation(animation=null) {
		if (animation === null) {
			animation = new Animation(this.editor);
		}

		this.editor.activeProject.addAnimation(animation);

		this.animationList.addChoice(animation.id, animation.name);

		this.selected = animation;
		this.select();
	}

	frameAdded() {
		if (this.selected.frames.length > 0) {
			this.ui.previewAnimation.show();
		} else {
			this.ui.previewAnimation.hide();
		}
	}
	
	//Called from SpriteSelector when this is added as a watcher
	spriteSelected(sprite) {
		if (this.selected === null) {
			return;
		}

		this.selected.addFrame(sprite);
		this.existingFrames.addChoice(sprite.id, sprite.name);
		this.frameAdded();
	}

	select() {
		if (this.selected === null) {
			return;
		}

		this.editor.spriteSelector.addWatcher('animation', this);

		//Set Options TODO
		this.ui.options.find('.animation-name').val(this.selected.name);
		
		for (var frame of this.selected.frames) {
			this.existingFrames.addChoice(frame.sprite.id, frame.sprite.name);
		}
		
		if (this.selected.frames.length >0) {
			this.ui.stopAnimation.hide();
			this.ui.previewAnimation.show();
		} else {
			this.ui.stopAnimation.hide();
			this.ui.previewAnimation.hide();
		}

		this.ui.existing.hide();
		this.ui.options.show();
	}
	
	clearAnimationOptions() {
		if (this.selected !== null) {
			this.selected.clearAnimation();
		}
		
		this.ui.frameOptions.hide();
		this.ui.previewFrame.hide();
		this.ui.previewAnimation.hide();
		this.existingFrames.clearChoices();
	}

	deselect() {
		this.editor.spriteSelector.removeWatcher('animation');
		this.editor.clearSelections();
		
		this.clearAnimationOptions();

		this.ui.options.hide();
		this.ui.existing.show();
	}

	removeAnimation() {

	}

	selectAnimation(selector) {
		var project = this.editor.activeProject;
		this.selected = project.getAnimationById(selector.val());

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
	
	setProject(project) {
		this.animationTab.loadAnimations();
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