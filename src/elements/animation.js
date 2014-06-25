var Utils = require('../utils.js');

class Animation {
	constructor(editor, info) {
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

		if (info !== undefined) {
			this.load(info);
		}

		this.id = Utils.generateId();
	}

	load(info) {
		var project = this.editor.activeProject;

		if (info.name !== undefined) {
			this.name = info.name;
		}

		if (info.frames !== undefined) {
			for (var frame of info.frames) {
				var sprite = project.getSpriteFromId(frame.sprite);
				this.addFrame(sprite, frame.duration);
			}
		}

		if (info.id !== undefined) {
			this.id = info.id;
		}
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

module.exports = {
	Animation: Animation
};