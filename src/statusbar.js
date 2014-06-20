var Utils = require('./utils.js');

class StatusBarController {
	constructor(editor) {
		this.editor = editor;

		//Zoom Controls
		this.zoomSelectOpen = false;
	}

	editorLoaded() {
		this.zoomFrame = this.editor.element.find('.zoom-frame');
		this.zoomValue = this.zoomFrame.find('.frame-value');
		this.mouseFrame = this.editor.element.find('.mouse-frame');
		this.mouseValue = this.mouseFrame.find('.frame-value');
		this.infoFrame = this.editor.element.find('.info-frame');
		this.infoValue = this.infoFrame.find('.frame-value');

		this.delegate();
	}

	updateStatus() {
		this.zoomValue.text(parseInt(this.editor.zoom*100));
		this.mouseValue.text('(' + this.editor.mousePos.x + ', ' + this.editor.mousePos.y + ')');
	}

	delegate() {
		this.zoomFrame.on('click', $.proxy(this.zoomSelectClick, this));
		this.zoomFrame.on('change', $.proxy(this.zoomSelectChange, this));
		this.zoomFrame.on('blur', $.proxy(this.zoomSelectBlur, this));
		this.zoomFrame.on('mouseenter', $.proxy(this.zoomFrameEnter, this));
		this.zoomFrame.on('mouseleave', $.proxy(this.zoomFrameLeave, this));
	}

	zoomSelectClick(e) {
		this.zoomSelectOpen = true;
	}

	zoomSelectChange(e) {
		this.zoomFrame.find('.zoom-control').hide();
		this.zoomFrame.find('.frame-value').show();
		this.zoomSelectOpen = false;
		
		var newZoom = (parseFloat($(e.target).val())/100.0).toFixed(2);

		this.editor.setZoom(newZoom);
		this.updateStatus();

	}

	zoomSelectBlur(e) {
		this.zoomFrame.find('.zoom-control').hide();
		this.zoomFrame.find('.frame-value').show();
		this.zoomSelectOpen = false;
	}

	zoomFrameEnter(e) {
		this.zoomFrame.find('.zoom-control').show();
		this.zoomFrame.find('.frame-value').hide();
	}

	zoomFrameLeave(e) {
		if (!this.zoomSelectOpen) {
			this.zoomFrame.find('.zoom-control').hide();
			this.zoomFrame.find('.frame-value').show();
		}
	}
}

module.exports = StatusBarController;