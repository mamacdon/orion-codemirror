/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

(function(){var e=this;e.define||(e.define=function(t){e.orion=e.orion||{},e.orion.Deferred=t(),delete e.define})})(),define([],function(){function o(o){if(s){o();return}if(i){e?(t.next={notify:o,next:null},t=t.next):(e={notify:o,next:null},t=e);return}i=!0;do{while(o)o(),n&&(e?t.next=n:e=n,t=r),e?(n=e.next,r=t,o=e.notify,e=t=null):o=null;i=!1}while(i)}function u(e){return function(){e.apply(null,arguments)}}function a(e){function l(){while(r){var e=r;r=r.next;var s=e.deferred,o=n==="resolved"?"resolve":"reject";if(e[o])try{var a=e[o](t);if(a&&typeof a.then=="function"){e.cancel=a.cancel,a.then(u(s.resolve),u(s.reject),s.progress);continue}s.resolve(a)}catch(f){s.reject(f)}else s[o](t)}r=i=null}function c(e){if(n){if(e)throw new Error("already "+n);return!0}return!1}var t,n,r,i,s=!1,f;this.cancel=function(r,i){if(c(i))return s?t.message:null;s=!0;if(e)try{r=e(r)||r}catch(u){}return r=r||"canceled",n="rejected",t=new Error(r),o(l),r},this.resolve=function(e,r){return c(r)||(n="resolved",t=e,o(l)),f},this.reject=function(e,r){return c(r)||(n="rejected",t=e,o(l)),f},this.progress=function(e,t){if(!c(t)){var n=r;while(n){if(n.progress)try{n.progress(e)}catch(i){}n=n.next}}return f},this.then=function(e,t,s){var u={resolve:e,reject:t,progress:s,cancel:this.cancel,deferred:new a(function(e){return u.cancel&&u.cancel(e)})};return r?i.next=u:r=u,i=u,n&&o(l),u.deferred.promise},this.isResolved=function(){return n==="resolved"},this.isRejected=function(){return n==="rejected"},this.isFulfilled=function(){return!!n},this.isCanceled=function(){return s},f={then:this.then,cancel:this.cancel,isResolved:this.isResolved,isRejected:this.isRejected,isFulfilled:this.isFulfilled,isCanceled:this.isCanceled},this.promise=f,this.notify=this.progress,this.state=function(){return n||"pending"},this.promise.state=this.state}var e,t,n,r,i=!1,s=!0;return a.all=function(e,t){function s(e,t){i.isFulfilled()||(r[e]=t,--n===0&&i.resolve(r))}function o(e,n){if(!i.isFulfilled()){if(t)try{s(e,t(n));return}catch(r){n=r}i.reject(n)}}var n=e.length,r=[],i=new a;return n===0?i.resolve(r):e.forEach(function(e,t){e.then(s.bind(null,t),o.bind(null,t))}),i.promise},a.when=function(e,t,n,r){var i,s;return e&&typeof e.then=="function"?i=e:(s=new a,s.resolve(e),i=s.promise),i.then(t,n,r)},a});