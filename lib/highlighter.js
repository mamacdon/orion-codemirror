/*jslint browser:true*/
/*global define */
define(["CodeMirror", "orion/textview/eventTarget"], function(mMirror, mEventTarget) {
	// TODO this affects indendation, which we don't support yet. Should be a parameter
	var tabSize = 4;
	var codeMirror = mMirror.CodeMirror;

	/**
	 * @name orion.codeMirror.Stream
	 * @class Encapsulates a line of code and our current position in the line.
	 */
	function Stream(str) {
		this.string = str;
		this.pos = 0;
		this.tokenStart = 0;
	}
	Stream.prototype = {
		eol: function() { return this.pos >= this.string.length; },
		sol: function() { return this.pos === 0; },
		peek: function() { return this.string[this.pos]; },
		next: function() { return this.string[this.pos++]; },
		eat: function(match) {
			var c = this.string[this.pos];
			var isMatch = (typeof c === "string") && (c === match || (match.test && match.test(c)) || (typeof match === "function" && match(c)));
			return isMatch ? this.string[this.pos++] : undefined;
		},
		eatWhile: function(match) {
			var ate = false;
			while (this.eat(match) !== undefined) {
				ate = true;
			}
			return ate;
		},	
		eatSpace: function() { return this.eatWhile(/\s/); },
		skipToEnd: function() { this.pos = this.string.length; },
		skipTo: function(ch) {
			var idx = this.string.indexOf(ch, this.pos);
			if (idx !== -1) {
				this.pos = idx;
				return true;
			}
			return false;
		},
		match: function(pattern, consume, caseFold) {
			consume = (consume === true || typeof consume === "undefined");
			if (typeof pattern === "string") {
				var str = caseFold ? this.string.toLowerCase() : this.string;
				pattern = caseFold ? pattern.toLowerCase() : pattern;
				var index = str.indexOf(pattern, this.pos);
				if (index !== -1 && consume) {
					this.pos = index + pattern.length;
				}
				return index !== -1;
			} else {
				var match = this.string.substring(this.pos).match(pattern);
				if (match && consume && typeof match[0] === "string") {
					this.pos += match.index + match[0].length;
				}
				return match;
			}
		},
		backUp: function(n) { this.pos -= n; },
		column: function() {
			var col = 0, i = 0;
			while (i < this.tokenStart) {
				col += (this.string[i++] === "\t") ? tabSize : 1;
			}
			return col;
		},
		indentation: function() {
			var index = this.string.search(/\S/);
			var col = 0, i = 0;
			while(i < index) {
				col += (this.string[i++] === "\t") ? tabSize : 1;
			}
			return col;
		},
		current: function() { return this.string.substring(this.tokenStart, this.pos); },
		advance: function() { this.tokenStart = this.pos; }
	};

	var TAB = "token_tab";
	var SPACE = "token_space";
	
	// Max number of lines to immediately re-highlight after an edit. Remaining lines are handled by follow-up jobs.
	var MAX_REHIGHLIGHT = 500;
	
	// Time in ms to wait between highlight jobs.
	var JOB_INTERVAL = 50;
	
	// Maximum duration in ms of the re-highlight job.
	var JOB_DURATION = 30;
	
	// TODOC
	// Syling will be broken up into chunks of this many lines.
	// (Avoids swamping the postmessage bus)
//	var MAX_LINES_PER_PASS = 800;
	
	// During a highlight job, when mode doesn't define a "compareStates" method and we find more than this 
	// number of consecutive unchanged lines, the job aborts. (Assume rest of file is already correctly highlighted)
	var ABORT_THRESHOLD = 3;
	
	// Maximum number of lines to backtrack when searching for previous state to resume parsing from.
	var MAX_BACKTRACK = 40;
	
	/**
	 * @name orion.codeMirror.Highlighter
	 * @class
	 */
	function Highlighter(model, whitespacesVisible) {
		this.initialize(model);
		//this.modeSpec = modeSpec;
		this.isWhitespaceVisible = (typeof whitespacesVisible === "undefined" ? false : whitespacesVisible);
		this.mode = null;
		
		this.isModeLoaded = false;
		this.lines = []; // Array of {style: Array, eolState: state}
		this.dirtyLines = [];
		this.redrawStart = Number.MAX_VALUE;
		this.redrawEnd = -1;
		this.timer = null;
	}
	Highlighter.prototype = {
		initialize: function(model) {
			this.model = model;
			var self = this;
			this.model.addEventListener("Changing", function(e) {
				self._onModelChanging(e);
			});
			this.model.addEventListener("Changed", function(e) { // Internal detail of TextModel, not good
				self._onModelChanged(e);
			});
			this.model.addEventListener("Destroy", function(e) {
				self._onDestroy(e);
			});
		},
		_onModelChanging: function(e) {
			this.startLine = this.model.getLineAtOffset(e.start);
		},
		_onModelChanged: function(e) {
			this._dbgEvent(e);
			var startLine = this.startLine;
			if (e.removedLineCount || e.addedLineCount) {
				// Patch up the line styles array; new lines get empty styles
				Array.prototype.splice.apply(this.lines, [startLine + 1, e.removedLineCount].concat(this.newLines(e.addedLineCount)));
			}
			
			if (!this.mode) {
				return;
			}
			
			// We need to continue at least until editEndLine, and possibly beyond up to MAX_REHIGHLIGHT
			var editEndLine = Math.max(e.addedLineCount, e.removedLineCount);
			var endLine = startLine + Math.min(editEndLine, MAX_REHIGHLIGHT);
			this.highlight(startLine, endLine);
			
			// Launch a job to fix up the rest of the buffer
			this.highlightLater(endLine + 1);
		},
		_onDestroy: function(e) {
			this.mode = null;
			this.lines = null;
			clearTimeout(this.timer);
			this.timer = null;
		},
		setViewportIndex: function(viewportIndex) {
			this.viewportIndex = viewportIndex;
		},
		_dbgEvent: function(e) {
//			var r = [];
//			for (var p in e) {
//				if (e.hasOwnProperty(p)) {
//					r.push(p + ": " + e[p]);
//				}
//			}
//			console.debug( r.join(", ") );
		},
		_dbgStyle: function() {
//			var r = [];
//			for (var i=0; i < this.lines.length; i++) {
//				var style = this.lines[i].style || [];
//				var l = "" + i + ": " ;
//				for (var j=0; j < style.length; j++) {
//					var region = style[j];
//					l += region[0] + "," + region[1] + "\"" + region[2] + "\" ";
//				}
//				r.push(l);
//			}
//			console.debug(r.join("\n"));
		},
		newLines: function(n, startIndex) {
			if (typeof startIndex === "undefined") { startIndex = 0; }
			var newLines = [];
			for (var i=0; i < n; i++) {
				newLines.push({
					style: null,
					eolState: null
				});
			}
			return newLines;
		},
		loadMode: function(modeSpec) {
			if (!modeSpec) { return; }
			this.mode = codeMirror.getMode(codeMirror.options, modeSpec);
			this.lines = this.newLines(this.model.getLineCount());
			this.highlight();
		},
		/**
		 * Highlights the given range of lines.
		 */
		highlight: function(startLine, endLine) {
			startLine = typeof startLine === "undefined" ? 0 : startLine;
			endLine = typeof endLine === "undefined" ? this.model.getLineCount() - 1 : endLine;
			var mode = this.mode;
			var state = this.getState(startLine);
			for (var i = startLine; i <= endLine; i++) {
				var line = this.lines[i];
				this.highlightLine(i, line, state);
				line.eolState = codeMirror.copyState(mode, state);
			}
//			console.debug("Redrawing " + startLine + " .. " + endLine);
			this.expandRedrawRange(startLine, endLine);
			this.sendStyle();
		},
		highlightLater: function(startLine) {
			this.dirtyLines.push(startLine);
			var self = this;
			this.timer = setTimeout(function() {
				self.highlightJob();
			}, JOB_INTERVAL);
		},
		/**
		 * Does a best-effort heuristic to highlight from some dirty line index up to model.getLineCount()
		 */
		highlightJob: function() {
			var stopTime = +new Date() + JOB_DURATION, compareStates = this.mode.compareStates, lineCount = this.model.getLineCount();
			while (this.dirtyLines.length) {
				var viewportIndex = this.viewportIndex, viewportLine = this.lines[viewportIndex], line;
				if (viewportLine && !viewportLine.eolState) {
					line = viewportIndex;
				} else {
					line = this.dirtyLines.pop();
				}
				this.expandRedrawRange(line, line);
				var resumeIndex = this.getResumeLineIndex(line), startIndex = resumeIndex + 1;
				var state = (resumeIndex >= 0) && this.lines[resumeIndex].eolState;
				state = state ? codeMirror.copyState(this.mode, state) : this.mode.startState();
				
				var numUnchanged = 0;
				for (var i=startIndex; i < lineCount; i++) {
					var l = this.lines[i];
					var oldState = l.eolState;
					var isChanged = this.highlightLine(i, l, state);
					l.eolState = codeMirror.copyState(this.mode, state);
					if (isChanged) {
						this.expandRedrawRange(startIndex, i+1);
					}
					var isCompareStop = compareStates && oldState && compareStates(oldState, l.eolState);
					var isHeuristicStop = !compareStates && !isChanged && (numUnchanged++ > ABORT_THRESHOLD);
					if (isCompareStop || isHeuristicStop) {
						break; // Abort, done
					} else if (!oldState || isChanged) {
						numUnchanged = 0;
					}
					var workRemains = i < lineCount || this.dirtyLines.length;
					var timeElapsed = +new Date() > stopTime && workRemains;
					if (timeElapsed) {
						// Stop, continue later
						//this.expandRedrawRange(startIndex, i + 1);
						this.highlightLater(i + 1);
						this.sendStyle(); // Fire what we've got so far
						return;
					}
				}
			}
			this.sendStyle();
		},
		getResumeLineIndex: function(lineIndex) {
			var lines = this.lines;
			for (var i = lineIndex - 1; i >= 0; i--) {
				if (lines[i].eolState || lineIndex - i > MAX_BACKTRACK) {
					return i;
				}
			}
			return -1;
		},
		/**
		 * Returns the state we can use for parsing from the start of the lineIndex'th line. The state is
		 * guaranteed to be correct; we highlight whatever preceding lines are necessary to get it.
		 * @returns {Object} The state. This object is safe to mutate.
		 */
		getState: function(lineIndex) {
			var mode = this.mode, lines = this.lines;
			var i, line;
			for (i = lineIndex-1; i >= 0; i--) {
				line = lines[i];
				if (line.eolState || lineIndex - i > MAX_BACKTRACK) {
					// CodeMirror optimizes by using least-indented line; we just use this line
					break;
				}
			}
			var state = (i >= 0) && lines[i].eolState;
			if (state) {
				state = codeMirror.copyState(mode, state);
				// Highlight from i up to lineIndex-1
				i = Math.max(0, i);
				for (var j = i; j < lineIndex-1; j++) {
					line = lines[j];
					this.highlightLine(j, line, state);
					line.eolState = codeMirror.copyState(mode, state);
				}
				return state; // is a copy of lines[lineIndex - 1].eolState
			} else {
				return mode.startState();
			}
		},
		/**
		 * Highlight a single line.
		 * @param {Number} lineIndex
		 * @param {Object} line
		 * @param {Object} state The state to use for parsing from the start of the line.
		 */
		highlightLine: function(lineIndex, line, state) {
			var model = this.model;
			if (model.getLineStart(lineIndex) === model.getLineEnd(lineIndex) && this.mode.blankLine) {
				this.mode.blankLine(state);
			}
			var style = line.style || [];
			var text = model.getLine(lineIndex);
			var stream = new Stream(text);
			var isChanged = !line.style;
			var newStyle = [], ws;
			for (var i=0; !stream.eol(); i++) {
				var tok = this.mode.token(stream, state) || null;
				var tokStr = stream.current();
				ws = this.whitespaceStyle(tok, tokStr, stream.tokenStart);
				if (ws) {
					// TODO Replace this (null) token with whitespace tokens. Do something smart
					// to figure out isChanged, I guess
				}
				var newS = [stream.tokenStart, stream.pos, tok]; // shape is [start, end, token]
				var oldS = style[i];
				newStyle.push(newS);
				isChanged = isChanged || !oldS || oldS[0] !== newS[0] || oldS[1] !== newS[1] || oldS[2] !== newS[2];
				stream.advance();
			}
			isChanged = isChanged || (newStyle.length !== style.length);
			if (isChanged) { line.style = newStyle.length ? newStyle : null; }
			return isChanged;
		},
		/**
		 * If given an un-token'd chunk of whitespace, this returns whitespace style tokens for it.
		 * @returns {Array} The whitespace styles for the token, or null.
		 */
		whitespaceStyle: function(token, str, pos) {
			if (!token && this.isWhitespaceVisible && /\s+/.test(str)) {
				var whitespaceStyles = [], start, type;
				for (var i=0; i < str.length; i++) {
					var chr = str[i];
					if (chr !== type) {
						if (type) {
							whitespaceStyles.push([pos + start, pos + i, (type === "\t" ? TAB : SPACE)]);
						}
						start = i;
						type = chr;
					}
				}
				whitespaceStyles.push([pos + start, pos + i, (type === "\t" ? TAB : SPACE)]);
				return whitespaceStyles;
			}
			return null;
		},
		expandRedrawRange: function(startLine, endLine) {
			this.redrawStart = Math.min(this.redrawStart, startLine);
			this.redrawEnd = Math.max(this.redrawEnd, endLine);
		},
		getRedrawAmount: function() {
			if (this.redrawStart !== Number.MAX_VALUE && this.redrawEnd !== -1) {
				return this.redrawEnd - this.redrawStart;
			}
			return 0;
		},
		// TODO: should sending be chunked? test performance
		// var tooManyLines = this.getRedrawAmount() > MAX_LINES_PER_PASS;
		sendStyle: function() {
			var start = this.redrawStart, end = this.redrawEnd;
			if (start < Number.MAX_VALUE && end > -1) {
				var style = {};
				for (var i=start; i <= end; i++) {
					var lineIndex = i, line = this.lines[lineIndex];
					var rangesErrors = line && this.styleToRangesErrors(line.style);
					if (rangesErrors) {
						var ranges = rangesErrors[0], errors = rangesErrors[1];
						var obj = {}, hasAnything = false;
						if (ranges && ranges.length) {
							obj.ranges = ranges;
							style[i] = obj;
							hasAnything = true;
						}
						if (errors && errors.length) {
							obj.errors = errors;
							style[i] = obj;
							hasAnything = true;
						}
						if (!hasAnything) {
							style[i] = null;
						}
					}
				}
				var event = {
					type: "StyleReady",
					style: style
				};
				this.dispatchEvent(event);
			}
//			console.debug("Fired " + (end - start) + " lines [" + start + ".." + end + "]");
			this.redrawStart = Number.MAX_VALUE;
			this.redrawEnd = -1;
		},
//		redraw: function() {
//			if (this.redrawStart < Number.MAX_VALUE && this.redrawEnd > -1) {
//				console.debug("draw " + this.redrawStart + "," + this.redrawEnd);
//				textView.redrawLines(this.redrawStart, this.redrawEnd);
//			}
//			this.redrawStart = Number.MAX_VALUE;
//			this.redrawEnd = -1;
//		},
		styleToRangesErrors: function(style) {
			if (!style) { return null; }
			var ranges = [], errors = [];
			for (var i=0; i < style.length; i++) {
				var elem = style[i]; // shape is [start, end, token]
				var className = this.token2Class(elem[2]);
				if (!className) { continue; }
				var obj = {
					start: elem[0],
					end: elem[1],
					style: {styleClass: className} };
				ranges.push(obj);
				if (className === "cm-error") {
					errors.push(obj);
				}
			}
			return [ranges, errors];
		},
		token2Class: function(token) {
			if (!token) { return null; }
			if (token === TAB || token === SPACE) { return token; }
			return "cm-" + token;
		}
	};
	mEventTarget.EventTarget.addMixin(Highlighter.prototype);
	return {
		Stream: Stream,
		Highlighter: Highlighter
	};
}, "orion/codemirror");