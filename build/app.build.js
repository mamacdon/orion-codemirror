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
	}
})