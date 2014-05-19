var Mustache = require('mustache');

var Elements = require('../c/elements.js');

class Tool {
	constructor() {
		this.enabled = false; //Default false specify otherwise
		this.element = null;

		this.build();
	}

	build() {
		this.element = $(Mustache.to_html(Tool.template, {name: this.name, icon: this.icon, text: this.label}));

		if (!this.enabled) {
			this.element.addClass('disabled');
		}
	}

	toggleEnabled(val) {
		if (val) {
			this.element.removeClass('disabled');
		} else {
			this.element.addClass('disabled');
		}

		this.enabled = val;
	}

	handle(editor) {}

	requiresSelection() {}
}

Tool.template = `
	<a href="#" class="button light" data-tool-name="{{ name }}">{{#icon}}<i class="{{icon}}"></i>&nbsp;{{/icon}}{{ text }}</a>
`;

class GroupTool extends Tool {
	constructor() {
		this.name = 'group-tool';

		this.icon = '';
		this.label = 'Make Group';

		super();
	}

	handle(editor) {
		var selection = editor.selection;
		var project = editor.active_project;

		var group = new Elements.Group(editor, {
			rect: selection.pos
		});

		project.addGroup(group);

		selection.destroy();
	}

	requiresSelection() { return true; }
}

class SpriteTool extends Tool {
	constructor() {
		this.name = 'sprite-tool';

		this.icon = '';
		this.label = 'Make Sprite';

		super();
	}

	handle(editor) {
		var selection = editor.selection;
		
	}

	requiresSelection() { return true; }
}


class Tools {
	constructor() {
		this.tools = [
			new GroupTool(),
			new SpriteTool()
		];
	}

	getToolByName(name) {
		for (var tool of this.tools) {
			if (tool.name === name) {
				return tool;
			}
		}
		return null;
	}

	toolEvent(ele, editor) {
		var name = $(ele).data('tool-name');

		var tool = this.getToolByName(name);
		if (tool === null || !tool.enabled) {
			return;
		}

		tool.handle(editor);
	}

	enableSelectionTools() {
		for (var tool of this.tools) {
			if (tool.requiresSelection()) {
				tool.toggleEnabled(true);
			}
		}
	}

	disableSelectionTools() {
		for (var tool of this.tools) {
			if (tool.requiresSelection()) {
				tool.toggleEnabled(false);
			}
		}	
	}

	renderToolsTo(container) {
		for (var tool of this.tools) {
			container.append(tool.element);
		}
	}
}

module.exports = Tools;