/*global define*/
define(["orion/textview/textModel"], function(mTextModel) {
	function _dbgEvent(e) {
//		var r = [];
//		for (var p in e) {
//			if (e.hasOwnProperty(p) && p !== "text") {
//				r.push(p + ": " + e[p]);
//			}
//		}
//		console.debug( r.join(", ") );
	}
	
	/**
	 * @name orion.editor.MirrorTextModel
	 * @class An implementation of {@link orion.textview.TextModel} that keeps its text content in sync with another
	 * <code>TextModel</code>'s.
	 * TODO We rely on onModelChanging being called, which is kind of wrong since only a TextView dispatches that.
	 * @extends orion.textview.TextModel
	 */
	function MirrorTextModel() {
	}
	MirrorTextModel.prototype = new mTextModel.TextModel();
	MirrorTextModel.prototype.onModelChanging = function(e) {
		_dbgEvent(e);
		var end = e.start + e.removedCharCount - e.addedCharCount;
		end = Math.min(end, this.getCharCount());
		end = Math.max(end, e.start);
		this.setText(e.text, e.start, end);
	};
	
	return {MirrorTextModel: MirrorTextModel};
}, "orion/editor");