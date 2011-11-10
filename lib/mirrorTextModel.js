/*global define orion*/
define(["orion/textview/textModel"], function(mTextModel) {
	/**
	 * @name orion.XXXXX.MirrorTextModel
	 * @class An implementation of {@link orion.textview.TextModel} that keeps its text content in sync with another
	 * <code>TextModel</code>'s.
	 * @description A <code>MirrorTextModel</code> listens to events from another {@link orion.textview.TextModel} and 
	 * performs the equivalent changes on itself.
	 */
	function MirrorTextModel() {
		this.model = new mTextModel.TextModel();
		// this.target = target;
	}
	// TODO keep same API as TextModel, just make this a facade that listens to another textmodel's events
	MirrorTextModel.prototype = {
		onDestroy: function(e) {
		},
		onLoad: function(e) {
			this._dbgEvent(e);
		},
		onModelChanging: function(e) {
			this._dbgEvent(e);
			var end = e.start + e.removedCharCount - e.addedCharCount;
			end = Math.min(end, this.model.getCharCount());
			end = Math.max(end, e.start);
			this.model.setText(e.text, e.start, end);
		},
		_dbgEvent: function(e) {
//			var r = [];
//			for (var p in e) {
//				if (e.hasOwnProperty(p) && p !== "text") {
//					r.push(p + ": " + e[p]);
//				}
//			}
//			console.debug( r.join(", ") );
		}
	};
	
	return {MirrorTextModel: MirrorTextModel};
}, "orion/editor");