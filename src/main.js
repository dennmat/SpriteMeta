global.$ = $;
var $traceurRuntime = global.$traceurRuntime;

var fs = require('fs');

var ngui = require('nw.gui');

var Editor = require('../c/editor.js');
var TabManager = require('../c/tabs.js');

class Main {
	constructor() {
		this.win = ngui.Window.get();
		this.win.showDevTools();

		this.tab_manager = null;
		this.config = {};

		this.loadConfig();
	}

	loadConfig() {
		fs.exists('sconfig.json', exists => {
			if (exists) {
				fs.readFile('sconfig.json', (err, data) => {
					this.config = JSON.parse(data);
					this.configLoaded();
				});
			} else {
				this.configLoaded();
			}
		});
	}

	configLoaded() {
		this.setUp();
	}

	setUp() {
		this.win.show();
		this.win.maximize();

		this.tab_manager = new TabManager();
		this.editor = new Editor($('.tab-views'), this.tab_manager);

		this.tab_manager.addTab('startpage.html', 'start', 'Start');
	}
}


$(function() {
	var m = new Main();
});