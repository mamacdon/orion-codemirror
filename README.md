Orion-codemirror is a plugin for [Eclipse Orion](http://wiki.eclipse.org/Orion) that provides syntax highlighting using [CodeMirror](http://codemirror.net/) [modes](http://codemirror.net/manual.html#modeapi).

Installing from the web
-----------------------
The most recent, minified version of this plugin is hosted on the web. It usually requires the latest stable version of Orion.

1. Go [here](https://orion-codemirror.googlecode.com/git/codeMirrorPlugin.html).
2. Follow the installation instructions.

Installing from source
----------------------
1. Checkout the [source repo from GitHub](https://github.com/mamacdon/orion-codemirror orion-codemirror).
2. Host the source on some web server. (If you're using Orion as your development environment, you can [create a site](http://wiki.eclipse.org/Orion/How_Tos/Setup_Orion_Client_Hosted_Site_on_OrionHub) to do this).
3. Load the URL of ```codeMirrorPlugin.html``` in your web browser.
4. Follow the installation instructions.

Optionally, you can minify the code to reduce download time: try the ```build/build.sh``` script.

Uninstalling
------------
1. Log in to Orion and go to the **Settings** page.
2. Click the **Plugins** category.
3. Find the "Orion Codemirror syntax highlighting" entry from the plugin list, then click the Delete button beside it.

Requirements
------------
* Orion

License
-------
[Eclipse Distribution License v 1.0](http://www.eclipse.org/org/documents/edl-v10.html). See the ```LICENSE``` file that accompanies this README.
