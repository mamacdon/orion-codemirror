({
	appDir: '../src/',   // relative to app.build.js
	baseUrl: 'js/',      // relative to appDir
	dir: '../out/',      // relative to app.build.js
	modules: [
		{	name: "codeMirrorPlugin"
		}
	],
	paths: {
		cm: 'codemirror2-compressed',
		'orion-cm': 'orioncodemirror',
		i18n: 'requirejs/i18n'
	},
	shim: {
		// Before loading the modes we need to set the CodeMirror global
		'cm/codemirror-compressed': {
			deps: ['orion-cm/globalCodeMirror']
		}
	}
})