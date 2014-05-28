var fs = require('fs');
var path = require('path');

var Utils = require('../c/utils.js');

class Project {
	constructor(info, editor, spriter_path=null) {
		this.editor = editor;
		this.id = Project.getUID();

		var info_not_undefined = !!(info !== undefined && info !== null);

		this.spriter_path = spriter_path;

		this.path = (info_not_undefined)? info.path : null;
		this.size = (info_not_undefined)? info.size : null;
		this.name = (info_not_undefined)? info.name : null;
		
		if (this.name == null) {
			this.name = "Untitled " + this.id.toString();
		}

		this.groups = (info_not_undefined)? info.groups : {};
		this.sprites = (info_not_undefined)? info.sprites : [];
		
		this.baseDimensions = (info_not_undefined)? new Utils.Rect(0, 0, info.dimensions.width, info.dimensions.height) : new Utils.Rect();

		this.editorInfo = {
			zoom: (info_not_undefined)? info.editorInfo.zoom : 1,
			pos: (info_not_undefined)? new Utils.Rect(info.editorInfo.pos.x, info.editorInfo.pos.y, 0, 0) : new Utils.Rect()
		};
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
		
		return new Utils.Rect(x - relative.x, y - relative.y);
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
	}

	addGroup(group) {
		var id = 'group-' + (++Project._group_count).toString();
		group.setId(id);

		this.groups[id] = group;

		this.markDirty(true);
	}

	addSprite(rect) {
		//Check for collisions
		for (var sprite of this.sprites) {
			if (sprite.rect.hasIntersect(rect)) {
				return false;
			}
		}

		this.sprites.push({
			region: rect
		});

		this.markDirty(true);
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
		return []; // [{region: sprite.region.toDict()} for (sprite of this.sprites)];
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