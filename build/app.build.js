({
	appDir: '../src/',   // relative to app.build.js
	baseUrl: 'lib/',     // relative to appDir
	dir: '../out/',      // relative to app.build.js
	modules: [
		{	name: "codeMirrorPlugin"
		}
	],
	paths: {
		i18n: 'requirejs/i18n'
	}
})