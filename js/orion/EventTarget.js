/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

define([],function(){function e(){this._namedListeners={}}return e.prototype={dispatchEvent:function(e){if(!e.type)throw new Error("unspecified type");var t=this._namedListeners[e.type];return t&&t.forEach(function(t){try{typeof t=="function"?t(e):t.handleEvent(e)}catch(n){typeof console!="undefined"&&console.log(n)}}),!e.defaultPrevented},addEventListener:function(e,t){if(typeof t=="function"||t.handleEvent)this._namedListeners[e]=this._namedListeners[e]||[],this._namedListeners[e].push(t)},removeEventListener:function(e,t){var n=this._namedListeners[e];if(n)for(var r=0;r<n.length;r++)if(n[r]===t){n.length===1?delete this._namedListeners[e]:n.splice(r,1);break}}},e.prototype.constructor=e,e.attach=function(t){var n=new e;t.dispatchEvent=n.dispatchEvent.bind(n),t.addEventListener=n.addEventListener.bind(n),t.removeEventListener=n.removeEventListener.bind(n)},e});