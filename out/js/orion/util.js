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

define([],function(){function v(e){var t=arguments;return e.replace(/\$\{([^\}]+)\}/g,function(e,n){return t[(n<<0)+1]})}function g(e,t){return e.createElementNS?e.createElementNS(m,t):e.createElement(t)}var e=navigator.userAgent,t=parseFloat(e.split("MSIE")[1])||undefined,n=parseFloat(e.split("Firefox/")[1]||e.split("Minefield/")[1])||undefined,r=e.indexOf("Opera")!==-1,i=parseFloat(e.split("Chrome/")[1])||undefined,s=e.indexOf("Safari")!==-1&&!i,o=parseFloat(e.split("WebKit/")[1])||undefined,u=e.indexOf("Android")!==-1,a=e.indexOf("iPad")!==-1,f=e.indexOf("iPhone")!==-1,l=a||f,c=navigator.platform.indexOf("Mac")!==-1,h=navigator.platform.indexOf("Win")!==-1,p=navigator.platform.indexOf("Linux")!==-1,d=h?"\r\n":"\n",m="http://www.w3.org/1999/xhtml";return{formatMessage:v,createElement:g,isIE:t,isFirefox:n,isOpera:r,isChrome:i,isSafari:s,isWebkit:o,isAndroid:u,isIPad:a,isIPhone:f,isIOS:l,isMac:c,isWindows:h,isLinux:p,platformDelimiter:d}});