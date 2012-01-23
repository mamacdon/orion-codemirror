/*global define document require window*/
require([
		'orion/plugin', 'orion/textview/eventTarget', 'orion/textview/textModel', 'orion/editor/mirror',
		'orioncodemirror/mirrorTextModel', 'orioncodemirror/highlighter'],
	function(mPlugin, mEventTarget, mTextModel, mMirror, mMirrorTextModel, mHighlighter) {
		// Expose Orion's implementation of CodeMirror API as the global CodeMirror object, since it's
		// needed by the CodeMirror modes that we are about to load.
		window.CodeMirror = new mMirror.Mirror();

		require(['codemirror2-compressed/modes-compressed', 'codemirror2/mode/htmlmixed/htmlmixed'],
			function(mModes, mHtmlmixed /* load last, so it steals text/html MIME back from xml mode */) {
				registerPlugin(mEventTarget, mTextModel, mMirror, mMirrorTextModel, mHighlighter, window.CodeMirror);
			});
});

function registerPlugin(mEventTarget, mTextModel, mMirror, mMirrorTextModel, mHighlighter, mirror) {
	/*global console eclipse CodeMirror window*/
	// Invert 1:1 map
	function invert(obj) {
		var result = {};
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				var arr = obj[key];
				if (arr instanceof Array) {
					for (var i=0; i < arr.length; i++) {
						var val = arr[i];
						result[val] = key;
					}
				} else {
					result[arr] = key;
				}
			}
		}
		return result;
	}
	
	var modes = ["clike", "clojure", "coffeescript", "css", "diff", "groovy", "haskell", "htmlmixed", "javascript", "jinja2", "lua", "markdown", "ntriples", "pascal", "perl", "php", "plsql", "python", "r", "rst", "ruby", "rust", "scheme", "smalltalk", "sparql", "stex", "tiddlywiki", "velocity", "xml", "xmlpure", "yaml"];
	var defaults = ["clike", "css", "htmlmixed", "javascript", "perl", "php", "ruby", "xml"];
	var deps = {
		"htmlmixed": ["css", "xml", "javascript"],
		"php": ["clike", "css", "javascript", "xml"]
	};
	var mime2ContentType = {
		"text/x-csrc": "text.c",
		"text/x-c++src": "text.cpp",
		"text/x-clojure": "text.clojure",
		"text/x-coffeescript": "text.coffeescript",
		"text/x-csharp": "text.csharp",
		"text/css": "text.css", // orion
		"text/x-diff": "text.diff",
		"text/x-groovy": "text.groovy",
		"text/x-haskell": "text.haskell",
		"text/html": "text.html", // orion
		"text/x-java": "text.java", // orion
		"text/javascript": "text.javascript", // orion
		"application/json": "text.json", // orion
		"jinja2": "text.jinja2",
		"text/x-lua": "text.lua",
		"text/x-markdown": "text.markdown",
		"text/n-triples": "text.ntriples",
		"text/x-pascal": "text.pascal",
		"text/x-perl": "text.perl",
		"text/x-php": "text.php",
		"application/x-httpd-php": "text.html+php",
		"text/x-plsql": "text.plsql",
		"text/x-python": "text.python",
		"text/x-rsrc": "text.r",
		"text/x-rst": "text.restructuredtext",
		"text/x-ruby": "text.ruby",
		"text/x-rustsrc": "text.rust",
		"text/x-scheme": "text.scheme",
		"text/x-stsrc": "text.sm",
		"application/x-sparql-query": "text.sparql",
		"text/stex": "text.stex",
		"text/x-tiddlywiki": "text.tiddlywiki",
		"text/velocity": "text.velocity",
		"text/xml": "text.xml", // orion
		/*"application/xml": ["xml"],*/
		"text/x-yaml": "text.yaml"
	};
	var contentType2Mime = invert(mime2ContentType);
	var mime2Ext = {
		"text/x-csrc": ["c", "C", "h"],
		"text/x-c++src": ["cc", "cpp", "c++"],
		"text/x-clojure": ["clj"],
		"text/x-coffeescript": ["coffee"],
		"text/x-csharp": ["cs"],
		"text/css": ["css"],
		"text/x-diff": ["diff", "patch"],
		"text/x-groovy": ["groovy"],
		"text/x-haskell": ["hs"],
		"text/html": ["html", "htm"],
		"text/x-java": ["java"],
		"text/javascript": ["js"],
		"application/json": ["json"],
		"jinja2": [],
		"text/x-lua": ["lua"],
		"text/x-markdown": ["md"],
		"text/n-triples": ["nt"],
		"text/x-pascal": ["pascal", "p"],
		"text/x-perl": ["pl"],
		"text/x-php": ["php", "php3", "php4", "php5"],
		"application/x-httpd-php": ["phtml"],
		"text/x-plsql": ["sql"],
		"text/x-python": ["py"],
		"text/x-rsrc": ["r"],
		"text/x-rst": ["rst"],
		"text/x-ruby": ["rb"],
		"text/x-rust": ["rs", "rc"],
		"text/x-scheme": ["scm", "ss"],
		"text/x-stsrc": ["sm"],
		"application/x-sparql-query": ["spk"],
		"text/stex": [],
		"text/x-tiddlywiki": [],
		"text/velocity": [],
		"text/xml": ["xml"],
		/*"application/xml": ["xml"],*/
		"text/x-yaml": ["yaml"]
	};
	
	function getMime(contentType) {
		return contentType2Mime[contentType.id];
	}
	function getContentTypeId(mime) {
		return mime2ContentType[mime];
	}
	function getMimes(modes) {
		return CodeMirror.listMIMEs().filter(
			function(mime) {
				var mname = CodeMirror._getModeName(mime);
				return modes.indexOf(mname) !== -1;
			});
	}
	// Create Orion content types for modes
	function getContentTypes(modes) {
		return getMimes(modes).map(function(mime) {
			// Turn it into a content type (some may already be defined, like text.html)
			var id = getContentTypeId(mime);
			return id && {
				id: id,
				extension: mime2Ext[mime],
				"extends": "text.plain"
			};
		}).filter(function(ct) { return !!ct; });
	}
	function boxes() {
		return Array.prototype.filter.call(document.getElementsByTagName("input"), function(i){ return i.type === "checkbox"; });
	}
	function updateURL() {
		var base = window.location.href.replace(window.location.hash, "");
		var q = boxes().map(function(box) { return box.checked && box.value; }).filter(function(b) { return !!b; });
		var hash = q.join("+");
		document.getElementById("url").value = base + (base[base.length-1] !== "#" ? "#" : "") + hash;
		window.location.hash = hash;
	}
	function add(what) {
		boxes().forEach(function(box) {
			box.checked = box.checked || what.indexOf(box.value) !== -1;
		});
	}
	function onBoxClick(e) {
		if (e.target.tagName === "LABEL") { return; }
		var box = e.target;
		if (deps[box.value]) { add(deps[box.value], true); }
		updateURL();
	}
	function createForm() {
		var list = document.getElementById("modelist");
		modes.forEach(function(mode) {
			var li = document.createElement("li");
			var label = document.createElement("label");
			var checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.value = mode;
			label.addEventListener("click", onBoxClick, false);
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(mode));
			li.appendChild(label);
			list.appendChild(li);
		});
	}
	
	function check(/*"all"|"none"|Array*/ what) {
		boxes().forEach(function(box) {
			box.checked = (what === "all" || (what instanceof Array && what.indexOf(box.value) !== -1));
		});
		updateURL();
	}
	
	function errback(e) { console.log("orion-codemirror: Couldn't install plugin: " + e); }
	
	// Register plugin
	(function() {
		var hash = (window.location.hash).substring(1);
		var modeSet = hash && hash.split("+");
		modeSet = (modeSet && modeSet.length) ? modeSet : defaults; // modeSet to install
		try {
			var model = new mMirrorTextModel.MirrorTextModel();
			var highlighter = new mHighlighter.Highlighter(model, mirror);
			var contentTypes = getContentTypes(modeSet);
			
			var provider = new eclipse.PluginProvider();
			var serviceProvider = provider.registerServiceProvider("orion.edit.model", 
				{	
					onModelChanging: function(modelChangingEvent) {
						model.onTargetModelChanging(modelChangingEvent);
					},
					onScroll: function(scrollEvent) {
						highlighter.setViewportIndex(scrollEvent.topIndex);
					}
				},
				{ types: ["ModelChanging", "Scroll"],
				  contentType: contentTypes
				});
			
			// Register editor associations for installed modes
			provider.registerServiceProvider("orion.file.contenttype", {},
				{	contentTypes: contentTypes
				});
			provider.registerServiceProvider("orion.navigate.openWith", {},
				{	editor: "orion.editor",
					contentType: contentTypes.map(function(ct) { return ct.id; })
				});
	
			var highlightServiceProvider = provider.registerServiceProvider("orion.edit.highlighter",
				{	setContentType: function(contentType) {
						var mime = getMime(contentType);
						if (mime) {
							highlighter.setMode(mime);
						} else {
							console.log("Missing MIME in content type " + contentType.id);
						}
					}
				},
				{ type: "highlighter",
				  contentType: contentTypes
				});
			highlighter.addEventListener("StyleReady", function(styleReadyEvent) {
				highlightServiceProvider.dispatchEvent("orion.edit.highlighter.styleReady", styleReadyEvent);
			});
			
			provider.connect(function(e){
				console.log("orion-codemirror: connected. Supported modes: [" + modeSet.join(",") + "]");
			}, errback);
		} catch (e) {
			errback(e);
		}
		
		createForm();
		check(modeSet);
		updateURL();
	}());
}