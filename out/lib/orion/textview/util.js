/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors: IBM Corporation - initial API and implementation
 *******************************************************************************/

define([],function(){function e(e){var t=arguments;return e.replace(/\$\{([^\}]+)\}/g,function(e,n){return t[(n<<0)+1]})}function t(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.send(),t.status!=404}function n(e){var n={root:!0},r,i="";try{r=require.s.contexts._.config.locale,i=require.s.contexts._.config.baseUrl}catch(s){}r=r||navigator.language||navigator.userLanguage;if(r){r=r.toLowerCase();var o=r.split("-"),u=e.split("/"),a=u[u.length-1],f=e.substring(0,e.length-a.length);t(i+f+r+"/"+a+".js")?n[r]=!0:o.length>1&&t(i+f+o[0]+"/"+a+".js")&&(n[o[0]]=!0)}return n}return{formatMessage:e,getNlsBundle:n}})