/*global define*/
/*jslint browser:true*/

/**
 * This set the global CodeMirror object. Must be loaded before any modes from CodeMirror2 are loaded,
 * as they expect the global to be set.
 */
define(['orion/editor/mirror'], function(mMirror) {
	var m = new mMirror.Mirror();
	window.CodeMirror = m;
	return m;
});