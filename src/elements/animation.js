var Utils = require('../utils.js');

class Animation {
	constructor(editor, info) {
		this.editor = editor;
		this.project = this.editor.activeProject;

		this.largestWidth = 0;
		this.largestHeight = 0;

		this.frames = []; //aka sprites, order matters

		this.name = 'Animation';

		//For rendering the animation
		this.frame = 0;
		this.sinceLastFrame = 0;
		this.loop = true;
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

	addFrame(sprite, duration=50) {
		//Duration in ms

		if (sprite.rect.w > this.largestWidth) {
			this.largestWidth = sprite.rect.w;
		}

		if (sprite.rect.h > this.largestHeight) {
			this.largestHeight = sprite.rect.h;
		}

		this.frames.push({
			duration: duration,
			sprite: sprite
		});
	}
	
	deleteFrame(id) {
		var project = this.editor.activeProject;
		
		var frameIndex = 0;
		for (var frame of this.frames) {
			if (frame.sprite.id === id) {
				break;
			}
			frameIndex++;
		}
		
		this.frames.splice(frameIndex, 1);
	}

	play(renderTo) {
		this.renderTo = renderTo;

		renderTo.css({
			'width': this.largestWidth + 'px',
			'height': this.largestHeight + 'px',
			'background-position': -this.frames[0].sprite.rect.x + 'px ' + -this.frames[0].sprite.rect.y + 'px'
		});

		if (this.playInterval !== null) {
			clearInterval(this.playInterval);
		}

		this.frame = 0;
		this.sinceLastFrame = Date.now();
		this.playInterval = setInterval($.proxy(this.tick, this), 10);
	}

	tick() {
		var frame = this.frames[this.frame];
		if (frame.duration <= Date.now() - this.sinceLastFrame) {
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

			this.renderTo.css({
				'background-position': -frame.sprite.rect.x + 'px ' + -frame.sprite.rect.y + 'px'
			});
		}
	}
	
	clearAnimation() {
		if (this.playInterval !== null) {
			clearInterval(this.playInterval);
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