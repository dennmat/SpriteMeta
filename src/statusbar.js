var Utils = require('./utils.js');

class StatusBarController {
	constructor(editor) {
		this.editor = editor;

		//Zoom Controls
		this.zoomSelectOpen = false;

		//Mouse Info
		this.mousePos = new Utils.Rect();
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
		this.mouseValue.text('(' + this.mousePos.x + ', ' + this.mousePos.y + ')');
	}

	delegate() {
		this.zoomFrame.on('click', $.proxy(this.zoomSelectClick, this));
		this.zoomFrame.on('change', $.proxy(this.zoomSelectChange, this));
		this.zoomFrame.on('blur', $.proxy(this.zoomSelectBlur, this));
		this.zoomFrame.on('mouseenter', $.proxy(this.zoomFrameEnter, this));
		this.zoomFrame.on('mouseleave', $.proxy(this.zoomFrameLeave, this));

		$('body').on('mousemove', '.image-holder', $.proxy(this.mouseMove, this));
	}

	mouseMove(e) {
		var container = this.editor.getEditorContainer();
		var relative = container.offset();
		var info = this.editor.activeProject.editorInfo;
		
		var pointer = this.editor.container.find('.pointer');
		var x = parseInt(((e.pageX - relative.left) + container.get(0).scrollLeft) / info.zoom) * info.zoom;
		var y = parseInt(((e.pageY - relative.top) + container.get(0).scrollTop) / info.zoom) * info.zoom;

		this.mousePos.x = parseInt(x/info.zoom);
		this.mousePos.y = parseInt(y/info.zoom);

		pointer.css({
			left: x,
			top: y
		});

		this.updateStatus();
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

	setInfo(msg, icon=null) {
		if (icon !== null) {
			this.infoFrame.find('i:first').removeClass().addClass('icon-'+icon);
			this.infoFrame.find('i:first').show();
		} else {
			this.infoFrame.find('i:first').hide();
		}

		this.infoValue.html(msg);
	}
}

module.exports = StatusBarController;