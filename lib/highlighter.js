/*jslint browser:true*/
/*global define*/
define(["orion/codeMirror"], function(mCodeMirror) {
	// TODO this affects indendation, which we don't support yet 
	var tabSize = 4;

	/**
	 * @name orion.codeMirror.Stream
	 * @class Encapsulates a line of code and our current position in the line.
	 */
	function Stream(str) {
		this.str = str;
		this.pos = 0;
		this.tokenStart = 0;
	}
	Stream.prototype = {
		eol: function() { return this.pos >= this.str.length; },
		sol: function() { return this.pos === 0; },
		peek: function() { return this.str[this.pos]; },
		next: function() { return this.str[this.pos++]; },
		eat: function(match) {
			var c = this.str[this.pos];
			var isMatch = (typeof c === "string") && (c === match || (match.test && match.test(c)) || (typeof match === "function" && match(c)));
			return isMatch ? this.str[this.pos++] : undefined;
		},
		eatWhile: function(match) {
			var ate = false;
			while (this.eat(match) !== undefined) {
				ate = true;
			}
			return ate;
		},	
		eatSpace: function() { return this.eatWhile(/\s/); },
		skipToEnd: function() { this.pos = this.str.length; },
		skipTo: function(ch) {
			var idx = this.str.indexOf(ch, this.pos);
			if (idx !== -1) {
				this.pos = idx;
				return true;
			}
			return false;
		},
		match: function(pattern, consume, caseFold) {
			consume = (consume === true || typeof consume === "undefined");
			if (typeof pattern === "string") {
				var str = caseFold ? this.str.toLowerCase() : str;
				pattern = caseFold ? pattern.toLowerCase() : pattern;
				var index = str.indexOf(pattern, this.pos);
				if (index !== -1 && consume) {
					this.pos = index;
				}
				return index !== -1;
			} else {
				var match = this.str.substring(this.pos).match(pattern);
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
				col += (this.str[i++] === "\t") ? tabSize : 1;
			}
			return col;
		},
		indentation: function() {
			var index = this.str.search(/\S/);
			var col = 0, i = 0;
			while(i < index) {
				col += (this.str[i++] === "\t") ? tabSize : 1;
			}
			return col;
		},
		current: function() { return this.str.substring(this.tokenStart, this.pos); },
		advance: function() { this.tokenStart = this.pos; }
	};

	var TAB = "token_tab";
	var SPACE = "token_space";
	
	// A change affecting less than this number of lines will cause immediate highlight rather than schedule for later.
	var IMMEDIATE_THRESHOLD = 4;

	// Time in ms between highlight passes.
	var HIGHLIGHT_INTERVAL = 75;
	
	// Maximum duration in ms of each pass.
	var HIGHLIGHT_DURATION = 50;
	
	// When mode doesn't define a "compareStates" method and we find more than this number of consecutive
	// unchanged lines, highlight aborts.
	var ABORT_THRESHOLD = 3;
	
	// Maximum number of lines to backtrack when searching for previous state to resume parsing from.
	var MAX_BACKTRACK = 40;
	
	// FIX: no textView. only TextModel (mirror text model really)
	/**
	 * @name orion.codeMirror.Highlighter
	 * @class
	 */
	function Highlighter(textView, modeFactory, whitespacesVisible) {
		this.initialize(textView);
		this.modeFactory = modeFactory;
		this.isWhitespaceVisible = !!whitespacesVisible || typeof whitespacesVisible === "undefined"; // TODO default to false
		this.mode = null;
		
		this.isModeLoaded = false;
		this.lines = []; // Array of {style: Array, eolState: state}
		this.dirtyLines = [];
		this.redrawStart = Number.MAX_VALUE;
		this.redrawEnd = -1;
		this.timer = null;
	}
	Highlighter.prototype = {
		_onModelChanged: function(e) {
			this._dbgEvent(e);
			var model = this.textView.getModel(), start = e.start, startLine = model.getLineAtOffset(start);
			var oldLines = this.lines.length;
			if (e.removedLineCount || e.addedLineCount) {
				Array.prototype.splice.apply(this.lines, [startLine, e.removedLineCount].concat(this.newLines(e.addedLineCount)));
			}
			// TODO: Shift indices in dirtyLines
//			var dl = [], shift = e.addedLineCount - e.removedLineCount, endLine = start + shift - 1;
//			for (var i=0; i < this.dirtyLines.length; i++) {
//				var lineIndex = this.dirtyLines[i];
//				if (lineIndex < startLine) { dl.push(lineIndex); }
//				else if (lineIndex > endLine) { dl.push(lineIndex + shift); }
//			}
//			this.dirtyLines = dl;
			
			if (Math.max(e.addedLineCount, e.removedLineCount) < IMMEDIATE_THRESHOLD) {
				this.dirtyLines.push(startLine);
				this.highlight();
			} else {
				this.dirtyLines.push(startLine);
				this.scheduleHighlight();
			}
		},
		// Temp
		_dbgEvent: function(e) {
			var r = [];
			for (var p in e) {
				if (e.hasOwnProperty(p)) {
					r.push(p + ": " + e[p]);
				}
			}
			console.debug( r.join(", ") );
		},
		//Temp
		_dbgStyle: function() {
			var r = [];
			for (var i=0; i < this.lines.length; i++) {
				var style = this.lines[i].style || [];
				var l = "" + i + ": " ;
				for (var j=0; j < style.length; j++) {
					var region = style[j];
					l += region[0] + "," + region[1] + "\"" + region[2] + "\" ";
				}
				r.push(l);
			}
			console.debug(r.join("\n"));
		},
		_onLineStyle: function(e) {
			this._dbgEvent(e);
			if (!this.isModeLoaded) {
				this.loadMode();
				this.isModeLoaded = true;
			}
			var line = this.lines[e.lineIndex];
			if (line) {
				var ranges = this.styleToRange(line.style, e.lineStart);
				if (ranges) { e.ranges = ranges; }
			}
		},
		_onDestroy: function(e) {
			this.mode = null;
			this.lines = null;
			this.dirtyLines = null;
			clearTimeout(this.timer);
			this.timer = null;
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
		loadMode: function() {
			this.mode = this.modeFactory(modeOptions);
			this.lines = this.newLines(this.textView.getModel().getLineCount());
			this.dirtyLines.push(0);
			this.highlight();
		},
		scheduleHighlight: function() {
			var self = this;
			this.timer = setTimeout(function() {
					self.highlight();
				}, HIGHLIGHT_INTERVAL);
		},
		highlight: function() {
			var stopTime = +new Date() + HIGHLIGHT_DURATION;
			var compareStates = this.mode.compareStates;
			var lineCount = this.textView.getModel().getLineCount();
			while (this.dirtyLines.length) {
				var dirty = this.dirtyLines.pop();
				var startIndex = this.getResumeLineIndex(dirty);
				var state = (startIndex > 0) && this.lines[startIndex - 1].eolState;
				state = state ? mCodeMirror.copyState(this.mode, state) : this.mode.startState();
				for (var i=startIndex, numUnchanged = 0; i < lineCount; i++) {
					var line = this.lines[i];
					var oldState = line.eolState;
					var isChanged = this.highlightLine(line, i, state);
					line.eolState = mCodeMirror.copyState(this.mode, state);
					if (isChanged) {
						this.expandRedrawRange(startIndex, i+1);
					}
					var isCompareStop = compareStates && oldState && compareStates(oldState, line.eolState);
					var isHeuristicStop = !compareStates && !isChanged && (numUnchanged++ > ABORT_THRESHOLD);
					if (isCompareStop || isHeuristicStop) {
						break; // Abort, done
					} else if (!oldState || isChanged) {
						numUnchanged = 0;
					}
					if (+new Date() > stopTime) {
						// Stop, continue later
						this.dirtyLines.push(i+1);
						this.expandRedrawRange(startIndex, i+1);
						this.scheduleHighlight();
						return;
					}
				}
			}
			// Finished highlight: redraw changed region
			this.redraw();
		},
		getResumeLineIndex: function(lineIndex) {
			for (var i=lineIndex; i >= 0; i--) {
				var line = this.lines[i];
				if (line.eolState) { return i; }
				if (lineIndex - i > MAX_BACKTRACK) {
					return i; // give up
				}
			}
			return 0;
		},
		highlightLine: function(line, lineIndex, state) {
			var model = this.textView.getModel();
			if (model.getLineStart(lineIndex) === model.getLineEnd(lineIndex) && this.mode.blankLine) {
				this.mode.blankLine(state);
			}
			var style = line.style || [];
			var text = model.getLine(lineIndex);
			var stream = new Stream(text);
			var isChanged = false;
			var newStyle = [], ws;
			for (var i=0; !stream.eol(); i++) {
				var tok = this.mode.token(stream, state);
				var tokStr = stream.current();
				ws = this.whitespaceStyle(tok, tokStr, stream.tokenStart);
				if (ws) {
					// TODO Replace this (null) token with whitespace tokens
					// on next iteration, if ws, don't call token(), but match against ws first
					// or something
				}
				var newS = [stream.tokenStart, stream.pos, tok]; // shape is [start, end, token]
				var oldS = style[i];
				newStyle.push(newS);
				isChanged = isChanged || !oldS || oldS[0] !== newS[0] || oldS[1] !== newS[1] || oldS[2] !== newS[2];
				stream.advance();
			}
			if (isChanged) { line.style = newStyle.length ? newStyle : null; }
			return isChanged;
		},
		// If we're dealing with a chunk of whitespace not styled by mode, returns TAB and SPACE styles for it
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
		redraw: function() {
			if (this.redrawStart < Number.MAX_VALUE && this.redrawEnd > -1) {
				console.debug("draw " + this.redrawStart + "," + this.redrawEnd);
				this.textView.redrawLines(this.redrawStart, this.redrawEnd);
			}
			this.redrawStart = Number.MAX_VALUE;
			this.redrawEnd = -1;
		},
		styleToRange: function(style, lineStart) {
			if (!style) { return null; }
			var range = [];
			for (var i=0; i < style.length; i++) {
				var elem = style[i]; // shape is [start, end, token]
				range.push({
					start: lineStart + elem[0],
					end: lineStart + elem[1],
					style: {styleClass: this.token2Class(elem[2])}
				});
			}
			return range;
		},
		token2Class: function(token) {
			if (token === TAB || token === SPACE) { return token; }
			return "cm-" + token;
		}
	};
	
	return {Stream: Stream, Highlighter: Highlighter};
}, "orion/codeMirror");