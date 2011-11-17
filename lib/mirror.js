/*global define CodeMirror*/
define(["CodeMirror"], function(mStream) {
	function keys(obj) {
		var k = [];
		for (var p in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, p)) {
				k.push(p);
			}
		}
		return k;
	}
	
	/**
	 * Exposes a global CodeMirror object that manages modes, MIME types, etc.
	 * @name CodeMirror
	 */
	var CodeMirror = {
		_modes: {},
		_mimes: {},
		options: {},
		setOption: function(option, value) { this.options[option] = value; },
		getOption: function(option) { return this.options[option]; },
		copyState: function(mode, state) {
			if (typeof mode.copyState === "function") { return mode.copyState(state); }
			var newState = {};
			for (var prop in state) {
				if (state.hasOwnProperty(prop)) {
					var value = state[prop];
					newState[prop] = (value instanceof Array) ? value.slice() : value;
				}
			}
			return newState;
		},
		defineMode: function(/**String*/ name, /**Function(options, config)*/ modeFactory) {
			this._modes[name] = modeFactory;
		},
		/**
		 * @param {String|Object} modeSpec See http://codemirror.net/manual.html#option_mode
		 */
		defineMIME: function(mime, modeSpec) {
			this._mimes[mime] = modeSpec;
		},
		/**
		 * @param {String|Object} modeSpec See http://codemirror.net/manual.html#option_mode
		 */
		getMode: function(options, modeSpec) {
			var config = {}, modeFactory;
			if (typeof modeSpec === "string" && this._mimes[modeSpec]) {
				modeSpec = this._mimes[modeSpec];
			}
			if (typeof modeSpec === "object") {
				config = modeSpec;
				modeFactory = this._modes[modeSpec.name];
			}
			modeFactory = modeFactory || this._modes[modeSpec];
			if (typeof modeFactory !== "function") {
				throw "Mode not found " + modeSpec;
			}
			return modeFactory(options, config);
		},
		listModes: function() {
			return keys(this._modes);
		},
		listMIMEs: function() {
			return keys(this._mimes);
		},
		_getModeName: function(mime) {
			var mname = this._mimes[mime];
			if (typeof mname === "object") { mname = mname.name; }
			return mname;
		}
	};
	
	// Highlight-calculating code
	// Listens to MirrorTextModel, parses
	// Dispatches event when it has more styles
	// ServiceRegistration listens to CodeMirrorHighightProvider, dispatches event on itself
	// Some MagicStyler on the Orion side gets the event, shoves it into editor.
	
	return CodeMirror;
}, "CodeMirror");
