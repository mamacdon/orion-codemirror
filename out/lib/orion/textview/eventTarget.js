/*******************************************************************************
 * Copyright (c) 2010, 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: 
 *		Felipe Heidrich (IBM Corporation) - initial API and implementation
 *		Silenio Quarti (IBM Corporation) - initial API and implementation
 ******************************************************************************/

define("orion/textview/eventTarget",[],function(){function e(){}return e.addMixin=function(t){var n=e.prototype;for(var r in n)n.hasOwnProperty(r)&&(t[r]=n[r])},e.prototype={addEventListener:function(e,t,n){this._eventTypes||(this._eventTypes={});var r=this._eventTypes[e];r||(r=this._eventTypes[e]={level:0,listeners:[]});var i=r.listeners;i.push({listener:t,useCapture:n})},dispatchEvent:function(e){if(!this._eventTypes)return;var t=e.type,n=this._eventTypes[t];if(n){var r=n.listeners;try{n.level++;if(r)for(var i=0,s=r.length;i<s;i++)if(r[i]){var o=r[i].listener;typeof o=="function"?o.call(this,e):o.handleEvent&&typeof o.handleEvent=="function"&&o.handleEvent(e)}}finally{n.level--;if(n.compact&&n.level===0){for(var u=r.length-1;u>=0;u--)r[u]||r.splice(u,1);r.length===0&&delete this._eventTypes[t],n.compact=!1}}}},isListening:function(e){return this._eventTypes?this._eventTypes[e]!==undefined:!1},removeEventListener:function(e,t,n){if(!this._eventTypes)return;var r=this._eventTypes[e];if(r){var i=r.listeners;for(var s=0,o=i.length;s<o;s++){var u=i[s];if(u&&u.listener===t&&u.useCapture===n){r.level!==0?(i[s]=null,r.compact=!0):i.splice(s,1);break}}i.length===0&&delete this._eventTypes[e]}}},{EventTarget:e}})