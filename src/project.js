var fs = require('fs');
var path = require('path');

var Utils = require('./utils.js');
var Elements = require('./elements');

class Project {
	constructor(info, editor, spriter_path=null) {
		this.editor = editor;
		this.id = Project.getUID();

		this.path = null;

		this.spriter_path = spriter_path;
		this.name = "Untitled " + this.id.toString();

		this.size = null;

		this.group = {};
		this.sprites = [];

		this.baseDimensions = new Utils.Rect();

		this.editorInfo = {
			zoom: 1,
			pos: new Utils.Rect()
		};

		if (info !== undefined && info !== null) {
			this.load(info);
		}
	}

	load(data) {
		this.path = data.path;
		this.size = data.size;
		this.name = data.name;

		this.baseDimensions = new Utils.Rect(0, 0, data.dimensions.width, data.dimensions.height);

		this.editorInfo = {
			zoom: data.editorInfo.zoom,
			pos: new Utils.Rect(data.editorInfo.pos.x, data.editorInfo.pos.y, 0, 0)
		};

		if (data.sprites) {
			for (var sprite of data.sprites) {
				var spriteObj = new Elements.Sprite(this, {
					rect: new Utils.Rect().fromDict(sprite.rect),
					name: sprite.name
				});
				this.addSprite(spriteObj, false);
			}
		}
	}

	setImagePosition(x, y) {
		this.editorInfo.pos.x = x;
		this.editorInfo.pos.y = y;
	}

	getImagePosition() {
		return this.editorInfo.pos;
	}

	relativePosToImagePos(x, y) {
		var relative = this.getImagePosition();
		
		var rect = new Utils.Rect(x - relative.x, y - relative.y);

		if (rect.x < 0) { rect.x = 0; }
		if (rect.y < 0) { rect.y = 0; }

		return rect;
	}

	imagePosToRelativePos(x, y) {
		var relative = this.getImagePosition();

		return new Utils.Rect(x + relative.x, y + relative.y);
	}

	markDirty(val) {
		this.dirty = val;
		this.editor.updateDirty(this.id);
	}

	setDimensions(rect) {
		this.baseDimensions = rect;
	}

	update() {
		for (var groupKey in this.groups) {
			this.groups[groupKey].reposition();
		}

		for (var sprite of this.sprites) {
			sprite.reposition();
		}
	}

	addGroup(group) {
		var id = 'group-' + (++Project._group_count).toString();
		group.setId(id);

		this.groups[id] = group;

		this.markDirty(true);
	}

	addSprite(sprite, makeDirty) {
		//Check for collisions
		//for (var sprite of this.sprites) {
		//	if (sprite.rect.hasIntersect(rect)) {
		//		return false;
		//	}
		//}
		this.sprites.push(sprite);

		if (makeDirty === undefined || makeDirty === true) {
			this.markDirty(true);
		}
	}

	getSpriteByUID(uid) {
		for (var sprite of this.sprites) {
			if (sprite.uid === parseInt(uid)) {
				return sprite;
			}
		}

		return null;
	}

	deleteSprite(sprite) {
		sprite.destroy();

		var idx = this.sprites.indexOf(sprite);
		this.sprites.splice(idx,1);
	}

	serializeGroups() {
		var result = {};

		for (var group_key in this.groups) {
			var group = this.groups[group_key];

			result[group.name] = group.serialize;
		}

		return result;
	}

	serializeSprites() {
		var sprites = [];

		for (var sprite of this.sprites) {
			sprites.push(sprite.serialize());
		}

		return sprites;
	}

	serializeEditorInfo() {
		return {
			zoom: this.editorInfo.zoom,
			pos: {
				x: this.editorInfo.pos.x,
				y: this.editorInfo.pos.y
			}
		}
	}

	serialize() {
		return {
			path: this.path,
			size: this.size,
			name: this.name,
			
			dimensions: {
				width: this.baseDimensions.w,
				height: this.baseDimensions.h
			},

			editorInfo: this.serializeEditorInfo(),

			groups: this.serializeGroups(),
			sprites: this.serializeSprites()
		};
	}

	export() {
		return {
			dimensions: {
				width: this.baseDimensions.w,
				height: this.baseDimensions.h
			},
			groups: this.serializeGroups(),
			sprites: this.serializeSprites()	
		};
	}

	exportProject(destination) {
		fs.writeFile(destination, JSON.stringify(this.export()), err => {});
	}

	saveProject(destination=null, postSave=null) {
		if (destination === null) {
			destination = this.spriter_path;
		}

		this.name = path.basename(destination);

		fs.writeFile(destination, JSON.stringify(this.serialize()), err => {
			if (postSave !== null) {
				postSave();
			}

			this.markDirty(false);
		});
	}
}

Project._open_count = -1;
Project.getUID = function() {
	Project._open_count++;
	return Project._open_count;
};

Project._group_count = -1;
Project._sprite_count = -1;

module.exports = Project;