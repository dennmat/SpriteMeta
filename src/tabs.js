var Mustache = require('mustache');

class TabManager {
	constructor() {
		this.tabs = {};
		this.active_tab = null;

		this.tabs_element = $('#tabs');
		this.tab_view_container = $('.tab-views');
		this.tab_element_template = `
			<li {{#active}}class="{{ active }}"{{/active}} data-tab-id="{{ id }}">
				<a href="#">{{ name }}</a>
			</li>
		`;
		this.tabs_view_template = `
			<div class="tab-view" data-tab-id="{{ id }}"></div>
		`;

		this.delegate();
	}

	addTab(filePath, id, name) {
		var active = ($.isEmptyObject(this.tabs))? 'active' : '';

		this.tabs_element.append($(Mustache.to_html(this.tab_element_template, {active: active, id: id, name: name})));
		
		var element = $(Mustache.to_html(this.tabs_view_template, {id: id, name: name}));

		if (!$.isEmptyObject(this.tabs)) { 
			element.hide();
		}

		this.tab_view_container.append(element);
		
		element.load(filePath);

		this.tabs[id] = {
			id: id,
			name: name,
			file: filePath,
			element: element,
			isEditor: false
		};
	}

	addEditorTab(editor, project, switch_to=false) {
		this.tabs[project.id] = {
			id: project.id,
			name: project.name,
			project: project,
			file: null,
			element: null,
			isEditor: true,
			editor: editor
		};

		this.tabs_element.append($(Mustache.to_html(this.tab_element_template, {active: switch_to, id: project.id, name: project.name})));

		if (switch_to) {
			this.switchToTab(project.id);
			editor.show();
		} 
	}

	updateTabName(id, name) {
		this.tabs[id].name = name;
		this.tabs_element.find('li[data-tab-id="' + id + '"] a').text(name);
	}

	markTabDirty(id) {
		this.tabs[id].dirty = true;
		this.tabs_element.find('li[data-tab-id="' + id + '"] a').text(this.tabs[id].name + '*');
	}

	markTabClean(id) {
		this.tabs[id].dirty = false;
		this.tabs_element.find('li[data-tab-id="' + id + '"] a').text(this.tabs[id].name);	
	}

	getTabById(id) {
		return this.tabs[id];
	}

	switchToTab(id) {
		$('li.active', this.tabs_element).removeClass('active');
		$('.tab-view').hide(); //Hide all

		var tab = this.getTabById(id);

		if (tab.isEditor) {
			tab.editor.switchToProject(id);
			$('#editor').show();
		} else {
			$('#editor').hide();
			tab.element.show(); //Show pertinent
		}
		this.tabs_element.find('li[data-tab-id="' + id + '"]').addClass('active'); //Activate
	}

	delegate() {
		this.tabs_element.on('click', 'li', e => {
			var tab = $(e.target).parents('li:first').data('tab-id');

			this.switchToTab(tab);
		});
	}
}

module.exports = TabManager