global.$ = $;
var $traceurRuntime = global.$traceurRuntime;

var ngui = require('nw.gui');

var Editor = require('./c/editor.js');
var TabManager = require('./c/tabs.js');

class Main {
	constructor() {
		this.win = ngui.Window.get();
		this.win.showDevTools();

		this.tab_manager = null;

		this.setUp();
	}

	setUp() {
		this.win.show();
		this.win.maximize();

		this.tab_manager = new TabManager();
		this.editor = new Editor($('.tab-views'), this.tab_manager);

		this.tab_manager.addTab('startpage.html', 'start', 'Start');
		//this.tab_manager.addTab('editor.html', 'editor1', 'Test.sprtr', true);
	}
}


$(function() {
	var m = new Main();
});