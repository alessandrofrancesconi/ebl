;(function(window, undefined){
 'use strict';
/**
 * @license 
 * Ebl: the embeddable blog v0.0.1
 * https://github.com/alessandrofrancesconi/ebl
 *
 * Author: Alessandro Francesconi (http://www.alessandrofrancesconi.it/)
 *
 * Copyright (C) 2016 Alessandro Francesconi
 * Licensed under the MIT license
 *
 */
 
/*global alertify, wysihtml, wysihtmlParserRules, ActiveXObject*/
 
var Ebl = window.Ebl = {};
    Ebl.version = '0.0.1';

var DEBUG = true;

// this script's location
var scripts = document.getElementsByTagName('script');
var scriptPath = scripts[scripts.length - 1].src.split('?')[0].split('/').slice(0, -1).join('/');

function bootUp () {
    var c = gState.container = document.querySelector('.ebl-container');
    if (isNullOrUndef(c)) return;
    
    gState.docTitle = document.title;
    var template = c.querySelector('ebl-template');
    
    var viewType = getDataAttribute(template, 'eblType');
    if (viewType == "page") {
        var page = parseInt(getDataAttribute(template, 'eblPageNum'), 10);
        lState.page = (isNaN(page) ? 0 : page);
    }
    else if (viewType == "post") {
        // there is a single post
        var post = {};
        post.status = PostStatus.parse(getDataAttribute(template, 'eblPostStatus'));
        
        if (post.status != PostStatus.NEW) {
            post.id = getDataAttribute(template, 'eblPostId');
            post.title = getDataAttribute(template, 'eblPostTitle');
            post.createdAt = parseDatetimeFromString(getDataAttribute(template, 'eblPostCreatedat'));
            post.updatedAt = parseDatetimeFromString(getDataAttribute(template, 'eblPostUpdatedat'));
            post.tags = parseTagsFromString(getDataAttribute(template, 'eblPostTags'));
            
            var eblEdit = getUrlParam(location.search, 'ebl-edit');
            if (eblEdit !== null && parseInt(eblEdit, 10) == 1) post.edit = true;
            
            setHistoryTitle(post.title);
        }
        else post.edit = true;
        
        lState.post = post;
    }
    
    // load all the dependencies
    var dependencies = [];
    if (gState.config.language != 'en') dependencies.push({url: scriptPath + '/languages/' + gState.config.language + '.js', type: 'js', required : false});
    dependencies.push({url: scriptPath + '/css/base.css', type: 'css', required : true});
    if (!hasAlertify() && !isBadBrowser()) {
        dependencies.push({url: scriptPath + '/libs/alertify/alertify.min.js', type: 'js', required : true});
        dependencies.push({url: scriptPath + '/libs/alertify/css/alertify.min.css', type: 'css', required : true});
        dependencies.push({url: scriptPath + '/libs/alertify/css/themes/default.min.css', type: 'css', required : false});
    }
    
    includeDependencies(dependencies, function() {            
        changeHistoryState(lState, null, null, true);
        setHistoryListener();
        
        buildAdminBar();
        
        var c = gState.container;
        activateScripts(c);
        enablePostLinks(c);
        enableNavLinks(c);
        
        sendRequest(
            ApiType.DATA, 
            'action=get_session', 
            'GET', true, 
            null,
            function(res) {
                gState.isAdmin = res.data.attributes.logged;
                if (gState.isAdmin === true) gState.authToken = res.data.attributes.token;
                setAdminMode();
                
                if (!isNullOrUndef(lState.post) && lState.post.edit) switchToEditorMode();
                if (window.location.hash == '#ebl-login') showLoginDialog();
            },
            function(code, error) {
                gState.isAdmin = false;
                gState.authToken = null;
                setAdminMode();
                
                if (code === ApiResult.EBL_ERROR_AUTH_NOADMIN) showInitRepoDialog();
                else {
                    var fullMsg = (code === ApiResult.EBL_ERROR_DB_ACCESS) ? 
                        'There is a problem connecting to the DB: ' + error.message :
                        'General error: ' + error.message;
                    
                    showPopup(PopupType.FATAL, fullMsg);
                }
            }
        );
        
        bindToEvent(window, 'beforeunload', function(e) {
            if (!isNullOrUndef(lState.editors)) {
                var message = l18n_("An editor is open. If you close the window, you will lose your changes.");
                e.returnValue = message; // Gecko, Trident, Chrome 34+
                return message;          // Gecko, WebKit, Chrome <34
            }
        });
        
        bindToEvent(window, 'hashchange', function(e) {
            if (window.location.hash == '#ebl-login') showLoginDialog();
        });
        
        var onBlogLoaded = gState.config.onBlogLoaded;
        if (typeof onBlogLoaded == 'function') onBlogLoaded();
    });
}

/**
 * @callback eventCallback
 * @param {object} event
 */

/**
 * @callback finishCallback
 */
 
 /**
 * @callback sendingCallback
 */
 
 /**
 * @callback requestCallback
 * @param {number} responseCode
 * @param {string} responseData
 */

if (!window.getComputedStyle) {
    window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
    }
}

// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {

        var k;

        // 1. Let O be the result of calling ToObject passing
        //    the this value as the argument.
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get
        //    internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If len is 0, return -1.
        if (len === 0) {
            return -1;
        }

        // 5. If argument fromIndex was passed let n be
        //    ToInteger(fromIndex); else let n be 0.
        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        // 6. If n >= len, return -1.
        if (n >= len) {
            return -1;
        }

        // 7. If n >= 0, then Let k be n.
        // 8. Else, n<0, Let k be len - abs(n).
        //    If k is less than 0, then let k be 0.
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        // 9. Repeat, while k < len
        while (k < len) {
            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the
            //    HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            //    i.  Let elementK be the result of calling the Get
            //        internal method of O with the argument ToString(k).
            //   ii.  Let same be the result of applying the
            //        Strict Equality Comparison Algorithm to
            //        searchElement and elementK.
            //  iii.  If same is true, return k.
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.15
// Reference: http://es5.github.io/#x15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var n, k,
            t = Object(this),
            len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }

        n = len - 1;
        if (arguments.length > 1) {
            n = Number(arguments[1]);
            if (n != n) {
                n = 0;
            }
            else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }

        for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

/* ******************** PUBLIC ********************* 
 * Functions that can be called from the outside
 * *************************************************/

Ebl.init = function(e, c) { initEbl(e, c); };
Ebl.showLogin = function() { showLoginDialog(); };
Ebl.openPreviews = function() { openPreviews(); };
Ebl.openPost = function(i) { openPost(i, false); };
Ebl.createNew = function() { openCreateNew(); };

// following: implementations of these functions

/**
 * This is the main function used to initialize Ebl.
 * @param {object} elem - The DOM element (or its ID) where to inject the Ebl structure
 * @param {object} config - A set of possible options
 */
function initEbl(elem, config) {
    
    // get the element where to put Ebl
    var domElem = null;
    if (isDOMElement(elem)) domElem = elem;
    else if (typeof elem === 'string') domElem = document.getElementById(elem);
    
    if (isNullOrUndef(domElem)) {
        logError('can\'t create Ebl on invalid element');
        return;
    }
    
    // apply user's config
    if (!isNullOrUndef(config)) {
        for (var key in config) {
            if (config.hasOwnProperty(key)) gState.config[key] = config[key];
        }
    }
    
    // read url params in order to switch to a given section (like a post or a page)
    var additionalParams = '';
    
    var handled = false;
    var eblPost, eblPage, eblNew;
    if ((eblPost = getUrlParam(location.search, 'ebl-post')) !== null) {
        additionalParams += '&ebl-post=' + eblPost;
        handled = true;
    }
    
    if (!handled && (eblPage = getUrlParam(location.search, 'ebl-page')) !== null) {
        additionalParams += '&ebl-page=' + parseInt(eblPage, 10);
        handled = true;
    }
    
    if (!handled && (eblNew = getUrlParam(location.search, 'ebl-new')) !== null && parseInt(eblNew, 10) == 1) {
        additionalParams += '&ebl-new=1';
        handled = true;
    }
    
    // synchronously calls the Render API in order to get the processed HTML for the current view
    sendRequest (
        ApiType.RENDER, 
        'action=get_html' + additionalParams + toUrlParameters(gState.config, 'template', 'postsPerPage'), 
        'GET', false,
        null, 
        function (res) {
            // save the entire HTML in the element, then continue
            domElem.insertAdjacentHTML('beforeend', res);
            bootUp();
        },
        function (code, msg) {
            domElem.insertAdjacentHTML('beforeend', msg);
        }
    );
}

/** Changes the current view to the 'Preview' section  */
function openPreviews (page) {
    var eblState = new LocalState();
    eblState.page = page ? page : 0;
    
    // update the URL parameters
    var newParams = addUrlParam(window.location.search, 'ebl-page', eblState.page);
    newParams = removeUrlParam(newParams, 'ebl-post');
    newParams = removeUrlParam(newParams, 'ebl-edit');
    newParams = removeUrlParam(newParams, 'ebl-new');
    changeHistoryState(eblState, null, newParams);
    
    showPreviewSection();
}

/** Changes the current view by opening the given post 
 * @param {string} postId - The post ID
 * @param {boolean} replace - If TRUE, replaces the current History state instead of creating a new one
 */
function openPost (postId, replace) {
    var eblState = new LocalState();
    eblState.post = {
        id: postId
    };
    
    var newParams = addUrlParam(window.location.search, 'ebl-post', eblState.post.id);
    newParams = removeUrlParam(newParams, 'ebl-edit');
    newParams = removeUrlParam(newParams, 'ebl-page');
    newParams = removeUrlParam(newParams, 'ebl-new');
    changeHistoryState(eblState, null, newParams, replace);
    
    showPostSection(eblState.post.id);
}

/** Changes the current view by opening the 'New post' section */
function openCreateNew () {
    if (!gState.isAdmin) {
        logError('can\'t open editor, admin not logged');
        return;
    }
    
    var eblState = {};
    eblState.post = {
        edit: true,
        status: PostStatus.NEW
    };
    
    var newParams = addUrlParam(window.location.search, 'ebl-new', '1');
    newParams = removeUrlParam(newParams, 'ebl-post');
    newParams = removeUrlParam(newParams, 'ebl-edit');
    newParams = removeUrlParam(newParams, 'ebl-page');
    changeHistoryState(eblState, null, newParams);
    
    showNewPostSection();
}


/*
	Base.js, version 1.1a
	Copyright 2006-2010, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

var Base = function() {
	// dummy
};

Base.extend = function(_instance, _static) { // subclass
	var extend = Base.prototype.extend;
	
	// build the prototype
	Base._prototyping = true;
	var proto = new this;
	extend.call(proto, _instance);
  proto.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
	delete Base._prototyping;
	
	// create the wrapper for the constructor function
	//var constructor = proto.constructor.valueOf(); //-dean
	var constructor = proto.constructor;
	var klass = proto.constructor = function() {
		if (!Base._prototyping) {
			if (this._constructing || this.constructor == klass) { // instantiation
				this._constructing = true;
				constructor.apply(this, arguments);
				delete this._constructing;
			} else if (arguments[0] != null) { // casting
				return (arguments[0].extend || extend).call(arguments[0], proto);
			}
		}
	};
	
	// build the class interface
	klass.ancestor = this;
	klass.extend = this.extend;
	klass.forEach = this.forEach;
	klass.implement = this.implement;
	klass.prototype = proto;
	klass.toString = this.toString;
	klass.valueOf = function(type) {
		//return (type == "object") ? klass : constructor; //-dean
		return (type == "object") ? klass : constructor.valueOf();
	};
	extend.call(klass, _static);
	// class initialisation
	if (typeof klass.init == "function") klass.init();
	return klass;
};

Base.prototype = {	
	extend: function(source, value) {
		if (arguments.length > 1) { // extending with a name/value pair
			var ancestor = this[source];
			if (ancestor && (typeof value == "function") && // overriding a method?
				// the valueOf() comparison is to avoid circular references
				(!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
				/\bbase\b/.test(value)) {
				// get the underlying method
				var method = value.valueOf();
				// override
				value = function() {
					var previous = this.base || Base.prototype.base;
					this.base = ancestor;
					var returnValue = method.apply(this, arguments);
					this.base = previous;
					return returnValue;
				};
				// point to the underlying method
				value.valueOf = function(type) {
					return (type == "object") ? value : method;
				};
				value.toString = Base.toString;
			}
			this[source] = value;
		} else if (source) { // extending with an object literal
			var extend = Base.prototype.extend;
			// if this object has a customised extend method then use it
			if (!Base._prototyping && typeof this != "function") {
				extend = this.extend || extend;
			}
			var proto = {toSource: null};
			// do the "toString" and other methods manually
			var hidden = ["constructor", "toString", "valueOf"];
			// if we are prototyping then include the constructor
			var i = Base._prototyping ? 0 : 1;
			while (key = hidden[i++]) {
				if (source[key] != proto[key]) {
					extend.call(this, key, source[key]);

				}
			}
			// copy each of the source object's properties to this object
			for (var key in source) {
				if (!proto[key]) extend.call(this, key, source[key]);
			}
		}
		return this;
	}
};

// initialise
Base = Base.extend({
	constructor: function() {
		this.extend(arguments[0]);
	}
}, {
	ancestor: Object,
	version: "1.1",
	
	forEach: function(object, block, context) {
		for (var key in object) {
			if (this.prototype[key] === undefined) {
				block.call(context, object[key], key, object);
			}
		}
	},
		
	implement: function() {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "function") {
				// if it's a function, call it
				arguments[i](this.prototype);
			} else {
				// add the interface using the extend method
				this.prototype.extend(arguments[i]);
			}
		}
		return this;
	},
	
	toString: function() {
		return String(this.valueOf());
	}
});


/* ********************* LOG ***********************
 * Very simple logging functions
 * *************************************************/
 
function logDebug (msg) {
    if (!DEBUG) return;
    console.log('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}

function logWarning (msg) {
    console.warn('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}

function logError (msg) {
    console.error('[Ebl v'+ Ebl.version +'] ' + msg.replace(/(\r\n|\n|\r)/gm, ''));
}

/** Gets the value of the given param in the URL
 * @param {string} url - A well-formatted URL
 * @param {string} paramName - Name of the param
 */
function getUrlParam (search, paramName) {
    return decodeURIComponent(
        (new RegExp('[?|&]' + paramName + '=' + '([^&;]+?)(&|#|;|$)').exec(search) || [,''])[1]
        .replace(/\+/g, '%20')) || null;
}
 
/** Returns a new URL adding the given param
 * @param {string} url - A well-formatted URL
 * @param {string} paramName - Name of the param to add
 * @param {string} paramValue - Value of the param
 */
function addUrlParam (url, paramName, paramValue) {
    if (url.indexOf(paramName + '=') >= 0) {
        var prefix = url.substring(0, url.indexOf(paramName));
        var suffix = url.substring(url.indexOf(paramName));
        suffix = suffix.substring(suffix.indexOf('=') + 1);
        suffix = (suffix.indexOf('&') >= 0) ? suffix.substring(suffix.indexOf('&')) : '';
        url = prefix + paramName + '=' + paramValue + suffix;
    }
    else if (url.indexOf('?') < 0) {
        url += '?' + paramName + '=' + paramValue;
    }
    else {
        url += '&' + paramName + '=' + paramValue;
    }
    
    return url;
}

/** Returns a new URL without the given param
 * @param {string} url - A well-formatted URL
 * @param {string} paramName - Name of the param to remove
 */
function removeUrlParam (url, paramName) {
    var urlparts = url.split('?');
    if (urlparts.length >= 2) {
        var prefix = encodeURIComponent(paramName) + '=';
        var pars = urlparts[1].split(/[&;]/g);
        
        for (var i = pars.length; i-- > 0; ) {
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                pars.splice(i, 1);
            }
        }
        
        url = urlparts[0] + '?' + pars.join('&');
    }
    
    if (url.indexOf('?', url.length - 1) !== -1) url.slice(0, -1);
    return url;
}

/** Encodes the given object into a well-formatted set of URL parameters
 * @param {object} obj - A Javascript object
 * @param {...string} var_args - List of properties to include in the resulting string
 */
function toUrlParameters(obj) {
    var str = '';
    var selection = [];
    for (var i = 1; i < arguments.length; ++i) {
        selection.push(arguments[i]);
    }
    
    for (var property in obj) {
        if (selection.length > 0 && selection.indexOf(property) == -1) continue;
        
        var value = obj[property];
        if (isNullOrUndef(value) || typeof value === 'function') continue;
        else if (typeof value == 'boolean') value = value ? 1 : 0;
        
        var paramName = property.replace(/([A-Z])/g, matcher);
        
        str += '&'+ paramName +'='+ value;
    }
    
    function matcher(m) {
        return '_' + m.toLowerCase();
    }
    
    return str;
}

/* ******************** UTILS **********************
 * You always need utilities...
 * *************************************************/
 
 /** Checks if the given object is not defined
 * @param {object} obj - A Javascript object
 */
function isNullOrUndef(obj) {
    return (typeof obj === 'undefined' || obj === null);
}

 /** Returns a copy of the given object
 * @param {object} obj - A Javascript object
 */
function clone(obj) {
    if (obj === null || 'object' !== typeof obj) return obj;
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

 /** Cross-compatible function to invalidate/remove a property from an object
 * @param {object} obj - A Javascript object
 * @param {string} prop - The name of the property
 */
function deleteProperty(obj, prop) {
    obj[prop] = undefined;
    try { delete obj[prop]; } catch (e) {}
}

 /** Escapes opening and closing HTML tags
 * @param {string} str - String to escape
 */
function safeTags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
}

/** Returns true when on mobile browser */
function isMobile() {
    return(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

/** Returns true when the browser sucks */
function isBadBrowser() {
    var v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
        all[0]
    );
    if (v <= 4) { // Check for IE>9 using user agent
        var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:|Edge\/)(\d+)/);
        v = match ? parseInt(match[1]) : undefined;
    }
    
    return v < 9;
}

function hasAlertify() {
    return !(typeof alertify === 'undefined');
}

/** Cross-browser addEventListener function
 * @param {object} elem - An element
 * @param {string} event - Event name
 * @param {eventCallback} callback - Event callback
 */
function bindToEvent(elem, event, callback) {
    if (elem.addEventListener) elem.addEventListener(event, callback, false);
    else elem.attachEvent(event, callback);
}

function parseTagsFromString(str) {
    var out = [];
    if (isNullOrUndef(str)) return out;
    
    var tagSplit = str.split(',');    
    var ids = [];
    for (var i = 0; i < tagSplit.length; ++i) {
        var clean = tagSplit[i].trim();
        clean = clean.replace(/ +(?= )/g, '');
        clean = clean.replace(/ /g, '-');
        clean = clean.toLowerCase();
        
        var t = { id : clean };
        if (t.id.length > 0 && ids.indexOf(t.id) == -1) {
            out.push(t);
            ids.push(t.id);
        }
    }
    return out;
}

function printTagsFromArray(arr) {
    var out = "";
    if (isNullOrUndef(arr)) return out;
    
    for (var i = 0; i < arr.length; ++i) {
        out += arr[i].id;
        if (i < arr.length - 1) out += ", ";
    }
    return out;
}

/** Create a Date object from string in the form 'YYYY-MM-DDThh:mm:ss'
 * @param {string} str - The formatted string
 */
function parseDatetimeFromString(str) {
    var regex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?:\:(\d{2}))?/;
    var res = regex.exec(str); 
    return new Date(
        (+res[1]),
        (+res[2])-1,
        (+res[3]),
        (+res[4]),
        (+res[5]),
        res[6] ? (+res[6]) : 0
    );
}

function printDatetimeFromObj(date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes();
}

function l18n_(key) {
    if (typeof ebl_l18n === 'undefined' || !ebl_l18n.hasOwnProperty(key)) {
        if (gState.config.language != 'en') logWarning("can't find translated text for key '"+ key +"', language '"+ gState.config.language +"'")
        return key;
    }
    else {
        return ebl_l18n[key];
    }
}

// Ebl uses a small set of APIs to fill the DOM during the navigation and editing:
var ApiType = {
    DATA: 'data',       // Provides endpoints to work with data and session (get_post, get_session, ...)
    RENDER: 'render'    // Endpoints that output portions of HTML produced by the template engine
};

// Result codes returned by the PHP API
var ApiResult = {
    EBL_SUCCESS :                   200,
    
    EBL_ERROR_BADREQUEST :          400,
    EBL_ERROR_AUTH_NOTLOGGED :      401,
    EBL_ERROR_NOTFOUND :            404,
    EBL_ERROR_AUTH_SHORTACCESS :    429,
    EBL_ERROR_AUTH_NOADMIN :        450,
    EBL_ERROR_AUTH_ALREADYADMIN :   451,
    EBL_ERROR_AUTH_TOOMANYADMINS :  452,
    
    EBL_ERROR_INTERNAL :            500,
    EBL_ERROR_DB_ACCESS :           550,
    EBL_ERROR_DB_INSERT :           551,
    EBL_ERROR_DB_UPDATE :           552
};

/**
 * Performs a request to one of the PHP APIs
 *
 * @param {string} apiType - The type of API to call
 * @param {string} params - Sequence of parameters to pass in URL format
 * @param {string} method - Method to use (POST or GET)
 * @param {boolean} async - If false, the request is made synchronously
 * @param {sendingCallback} onSending - Function called when the transmission starts
 * @param {requestCallback} onDone - Function called when a result is available
 * @param {requestCallback} onError - Function called when a remote error occurred
 */
function sendRequest (apiType, params, method, async, onSending, onDone, onError) {
    logDebug('sending request... ' + 
             'params: ' + params  + ' | ' + 
             'type: '   + apiType + ' | ' + 
             'method: ' + method  + ' | ' + 
             'async: '  + async);
    
    var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState < 4) {
            if (typeof onSending == 'function') onSending();
        }
        else if (xmlhttp.readyState == 4) {
            xmlhttp.onreadystatechange = null;
            var r = xmlhttp.responseText;
            
            if (xmlhttp.status == 200) {
                logDebug('response from ' + apiType + ' API: ' + r);
                
                if (typeof onDone == 'function') {
                    if (apiType == ApiType.RENDER) onDone(r);
                    else onDone(JSON.parse(r));
                }
            }
            else {
                var errorMsg = null;
                if (apiType == ApiType.RENDER) errorMsg = r;
                else errorMsg = JSON.parse(r).errors[0].message;
                
                logError('error ' + xmlhttp.status + ' from ' + apiType + ' API: ' + errorMsg);
                if (typeof onError == 'function') onError(xmlhttp.status, errorMsg);
            }
        }
    };
    
    try {
        if (method == 'GET') {
            xmlhttp.open(method, scriptPath + '/api/' + apiType + '.php?' + params, async);
            xmlhttp.send(null);
        }
        else if (method == 'POST') {
            xmlhttp.open(method, scriptPath + '/api/' + apiType + '.php', async);
            xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=utf-8');
            xmlhttp.send(params);
        }
    }
    catch (ex) {
        logError('error connecting to Ebl API: ' + ex);
    }
}


/* ******************** CLASS **********************
 * Utility functions to work with classnames
 * *************************************************/

function hasClass (element, cls) {
    return (element.className.match(new RegExp('(\\s|^)'+ cls +'(\\s|$)')) !== null);
}

function addClass (element) {
    for (var i = 1; i < arguments.length; ++i) {
        var cls = arguments[i];
        if (!hasClass(element, cls)) {
            if (element.className.length > 0) element.className += ' ';
            element.className += cls;
        }
    }
}

function removeClass (element) {
    for (var i = 1; i < arguments.length; ++i) {
        var cls = arguments[i];
        if (hasClass(element, cls)) {
            var reg = new RegExp('(\\s|^)'+ cls +'(\\s|$)');
            element.className = element.className.replace(reg, ' ');
            element.className = element.className.trim();
        }
    }
}

/* ******************** CLASS **********************
 * Utility functions to work with DOM elements
 * *************************************************/

function createButton(actionClass, title) {
    var b = document.createElement('button');
    addClass(b, 'ebl-button');
    if (actionClass) addClass(b, actionClass);
    if (title) b.title = title;
    
    return b;
}

function addTooltipTo(elem, text) {
    var tooltip = document.createElement('span');
    setDataAttribute(tooltip, "tooltip", text);
    tooltip.appendChild(elem);
    
    return tooltip;
}

function activateScripts(elem) {
    var scripts = elem.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var s = document.createElement('script');
        s.innerHTML = scripts[i].innerHTML;

        // add the new node to the page
        scripts[i].parentNode.appendChild(s);
        
        // remove the original (non-executing) node from the page
        scripts[i].parentNode.removeChild(scripts[i]);
    }
}

function prependTo(parent, elem) {
    parent.insertBefore(elem, parent.childNodes[0]);
}

function showElement(elem) {
    if (isNullOrUndef(elem)) return;
    
    if (!isNullOrUndef(elem.origDisplay)) elem.style.display = elem.origDisplay;
    else elem.style.display = 'inline-block';
}

function hideElement(elem) {
    if (isNullOrUndef(elem)) return;
    
    if (hasClass(elem, 'ebl-toolbar')) elem.style.visibility = 'hidden';
    else {
        if (isNullOrUndef(elem.origDisplay)) {
            elem.origDisplay = 
                elem.currentStyle ? elem.currentStyle.display : getComputedStyle(elem, null).display;
        }
        
        elem.style.display = 'none';
    }
}

function removeElement(e) {
    if (isNullOrUndef(e)) return;
    e.parentNode.removeChild(e);
}

function animate(elem, what, unit, isProperty, from, to, time, onCompleted) {
    logDebug('animating with values: ' + elem + ' ' + what + ' ' + unit + ' ' + isProperty + ' ' + from + ' ' + to + ' ' + time);
    var start = new Date().getTime();
    var timer = setInterval(function() {
        var step = Math.min(1, (new Date().getTime() - start) / time);
        if (isProperty) elem[what] = (from + easing(step) * (to - from)) + unit;
        else elem.style[what] = (from + easing(step) * (to - from)) + unit;
        
        if (step == 1) {
            clearInterval(timer);
            if (typeof onCompleted === 'function') onCompleted();
        }
    }, 10);
    
    if (isProperty) elem[what] = from + unit;
    else elem.style[what] = from + unit;
    
    var easing = function (t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };
}

/** Gets the value of a HTML5 'data-' attribute (compatible with older browsers)
 * @param {Object} elem - The element
 * @param {string} key - Name of the data attribute
 */
function getDataAttribute(elem, key) {
    if (elem.dataset) return elem.dataset[key];
    else {
        key = key.replace(/([A-Z])/g, function (match) { 
            return '-' + match.toLowerCase();
        });
        
        return elem.getAttribute('data-' + key);
    }
}

/** Sets the value of a HTML5 'data-' attribute (compatible with older browsers)
 * @param {Object} elem - The element
 * @param {string} key - Name of the data attribute
 * @param {string} value - Value of the data attribute
 */
function setDataAttribute(elem, key, value) {
    if (elem.dataset) elem.dataset[key] = value;
    else {
        key = key.replace(/([A-Z])/g, function (match) { 
            return '-' + match.toLowerCase();
        });
        
        elem.setAttribute('data-' + key, value);
    }
}

/** Returns true if it is a DOM element   
 * @param {Object} obj - An object
 */
function isDOMElement(obj){
    return (
        typeof HTMLElement === "object" ? obj instanceof HTMLElement :
        obj && typeof obj === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName==="string"
    );
}

/** Adds all the given files as dependencies in the Document.
 * Supported formats: JS and CSS.
 * @param {Object} list - An array of dependecy information. Every element is an object structured like this:
 *                        { type : "<js|css>", url : "<url of the resource>", required : <true|false>};
 * @param {finishCallback} onDone - Function called when all the files have been included
 */
function includeDependencies (list, onDone) {
    var count = 0;
    var total = list.length;
    
    if (total === 0) {
        onDone();
        return;
    }
    
    var i = 0;
    while (i < total) {
        include(list[i], includeCallback); 
        i++;
    }
    
    function includeCallback (url) {
        logDebug(url + ' loaded');
        if (++count == total) onDone();
    }
    
    function include(file, callback) {
        var elem;
        
        if (file.type === 'css') {
            elem = document.createElement('link');
            elem.rel = 'stylesheet';
            elem.type = 'text/css';
            elem.href = file.url;
            if (typeof callback === 'function') callback(file.url);
        }
        else if (file.type === 'js') {
            elem = document.createElement('script');
            elem.type = 'text/javascript';
            
            if (elem.readyState) {
                elem.onreadystatechange = function() {
                    if (elem.readyState == 'loaded' || elem.readyState == 'complete') {
                        elem.onreadystatechange = null;
                        if (typeof callback === 'function') callback(file.url);
                    }
                };
            } else {
                elem.onload = function() {
                    if (typeof callback === 'function') callback(file.url);
                };
                elem.onerror = function() {
                    logError('error loading ' + file.url);
                    if (!file.required && typeof callback === 'function') callback(file.url);
                };
            }
            
            elem.src = file.url;
        }
        
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(elem);
    }
}


var editorDepLoad = 0;

function switchToEditorMode () {
    if (!gState.isAdmin) {
        logError('can\'t open editor, admin not logged');
        return;
    }
    
    if (typeof wysihtml === 'undefined') {
        
        if (editorDepLoad >= 1) {
            logError('error loading editor library.');
            return;
        }
        else editorDepLoad ++;
        
        logDebug('editor library not yet loaded. perform loading now...');
        var dependencies = [];
        dependencies.push({url: scriptPath + '/libs/wysihtml/wysihtml.min.js', type: 'js'});
        dependencies.push({url: scriptPath + '/libs/wysihtml/wysihtml.toolbar.min.js', type: 'js'});
        
        // include core wysihtml, then plugins
        includeDependencies(dependencies, function() {
            dependencies = [];
            dependencies.push({url: scriptPath + '/libs/wysihtml/wysihtml.table_editing.min.js', type: 'js'});
            dependencies.push({url: scriptPath + '/libs/wysihtml/parser_rules/advanced_and_extended.js', type: 'js'});
            includeDependencies(dependencies, function() { switchToEditorMode(); }); 
        });
        
        return;
    }
    
    initEditors();
}

function initEditors() {        
    var editorInstances = {};
    
    var postElem = gState.container.querySelector(
        lState.post.status === PostStatus.NEW ? 
            '.ebl-post-new' :
            '.ebl-post-singleview#ebl-post_' + lState.post.id
    );
    
    var titleElem = postElem.querySelector('.ebl-post-title');
    addClass(titleElem, 'ebl-editable');
    titleElem.contentEditable = true;
    if (lState.post.status === PostStatus.NEW) titleElem.innerHTML =  l18n_("Title here...");
    else titleElem.oldValue = titleElem.innerHTML;
    
    var titleToolbar = gState.container.querySelector('.ebl-title-toolbar');
    if (isNullOrUndef(titleToolbar)) titleToolbar = buildTitleToolbar();
    
    editorInstances.title = titleElem;
    bindToEvent(editorInstances.title, 'keypress', preventReturnKey);
    bindToEvent(editorInstances.title, 'focus', showTitleToolbar);
    bindToEvent(editorInstances.title, 'blur', hideTitleToolbar);
    
    var contentElem = postElem.querySelector('.ebl-post-body');
    addClass(contentElem, 'ebl-editable');
    contentElem.oldValue = contentElem.innerHTML;
            
    var editorToolbar = gState.container.querySelector('.ebl-editor-toolbar');
    if (isNullOrUndef(editorToolbar)) editorToolbar = buildEditorToolbar();
    
    editorInstances.content = new wysihtml.Editor(contentElem, {
        name: 'ebl-editor-body',
        style: false,
        showToolbarAfterInit: false,
        parserRules: wysihtmlParserRules,
        uneditableContainerClassname: false,
        useLineBreaks: false,
        toolbar: editorToolbar
    });
    
    if (lState.post.status === PostStatus.NEW) editorInstances.content.setValue('<p>' + l18n_("... and content here") + '</p>');
    editorInstances.content.on('newword:composer', moveToolbar);
    editorInstances.content.on('show:dialog', function () { addClass(editorToolbar, 'ebl-sticky'); } );
    editorInstances.content.on('cancel:dialog', function () { removeClass(editorToolbar, 'ebl-sticky'); } );
    editorInstances.content.on('blur', hideToolbar);        
    editorInstances.content.on('change_view', switchHtmlToolbar);
    bindToEvent(contentElem, 'click', moveToolbar);
    
    lState.editors = editorInstances;
    
    // remove comments area when status is NEW 
    if (lState.post.status === PostStatus.NEW) {
        var comments = postElem.querySelectorAll('.ebl-post-comments');
        for (var i = 0; i < comments.length; ++i) removeElement(comments[i]);
    }
    
    function moveToolbar (event, stayOnTop) {
        if (!isNullOrUndef(event) && isNullOrUndef(lState.editors)) {
            (event.target || event.srcElement).removeEventListener('click', this);
            return false;
        }
        
        var left = null, top = null;
        var docElem = document.documentElement;
        var screenWidth = Math.max(docElem.clientWidth, window.innerWidth || 0);
        
        if (isMobile() || stayOnTop) {
            var editorBounds = contentElem.getBoundingClientRect();
            left = editorBounds.left + ((contentElem.offsetWidth / 2) - editorToolbar.offsetWidth / 2);
            top = editorBounds.top - editorToolbar.offsetHeight - 5;
        }
        else {
            var caretPos = null, range = null;
            if (document.selection && document.selection.createRange){
                range = document.selection.createRange();
                caretPos = { top: range.offsetTop, left: range.offsetLeft };
            } else if (window.getSelection && window.getSelection().rangeCount > 0){
                range = window.getSelection().getRangeAt(0).cloneRange();
                var bounds = range.getBoundingClientRect();
                caretPos = { top: bounds.top, left: bounds.left };
            }
            
            if (!isNullOrUndef(caretPos)) {
                var centerWidth = (editorToolbar.offsetWidth / 2);
                left = caretPos.left - centerWidth + 5;
                if (left < 5) {
                    left = 5;
                }
                else if (left > screenWidth - centerWidth - 5) {
                    left = screenWidth - centerWidth - 5;
                }
                
                top = caretPos.top - editorToolbar.offsetHeight - 20;
            }
        }
        
        if (left !== null || top !== null) {
            // fix scroll
            var screenScrollLeft = (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0);
            var screenScrollTop = (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop || 0);
            left += screenScrollLeft;
            top += screenScrollTop;
            
            var isValid = true;
            var prevLeft = parseInt(editorToolbar.style.left, 10);
            if (isNaN(prevLeft)) isValid = false;
            var prevTop = parseInt(editorToolbar.style.top, 10);
            if (isNaN(prevTop)) isValid = false;
            
            editorToolbar.style.visibility = 'visible';
            if (isValid) {
                animate(editorToolbar, 'left', 'px', false, Math.ceil(prevLeft), Math.ceil(left), 300);
                animate(editorToolbar, 'top', 'px', false, Math.ceil(prevTop), Math.ceil(top), 300);
            }
            else {
                editorToolbar.style.left = Math.ceil(left) + 'px';
                editorToolbar.style.top = Math.ceil(top) + 'px';
            }
            
            return true;
        }
        else {
            hideToolbar();
            return false;
        }
    }
    
    function hideToolbar () {
        if (!hasClass(editorToolbar, 'ebl-sticky')) {
            hideElement(editorToolbar);
        }
    }
    
    function switchHtmlToolbar (event) {
        var isHtml = (event === 'textarea');
        var elements = editorToolbar.querySelectorAll('.ebl-button, .ebl-separator');
        
        for (var i = 0; i < elements.length; i++) {
            isHtml ? hideElement(elements[i]) : showElement(elements[i]) ;
        }
        
        var buttonHtml = editorToolbar.querySelector('.ebl-action-editor-html');
        if (isHtml) {
            removeClass(buttonHtml, 'ebl-icon-file-code');
            addClass(buttonHtml, 'ebl-icon-file-text', 'ebl-icon-2x');
            buttonHtml.title = l18n_("Close HTML");
            showElement(buttonHtml);
            
            addClass(editorToolbar, 'ebl-sticky');
        }
        else {
            removeClass(buttonHtml, 'ebl-icon-file-text', 'ebl-icon-2x');
            addClass(buttonHtml, 'ebl-icon-file-code');
            buttonHtml.title = l18n_("Edit HTML");
            
            removeClass(editorToolbar, 'ebl-sticky');
        }
        
        moveToolbar({}, true);
    }
    
    function showTitleToolbar () {
        var titleElem = lState.editors.title;
        var titleBounds = titleElem.getBoundingClientRect();
        var left = titleBounds.left + ((titleElem.offsetWidth / 2) - titleToolbar.offsetWidth / 2);
        var top = titleBounds.top - titleToolbar.offsetHeight - 5;
        
        var docElem = document.documentElement;
        var screenScrollLeft = (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0);
        var screenScrollTop = (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop || 0);
        left += screenScrollLeft;
        top += screenScrollTop;
        
        titleToolbar.style.left = Math.ceil(left) + 'px';
        titleToolbar.style.top = Math.ceil(top) + 'px';
        titleToolbar.style.visibility = 'visible';
        return true;
    }
    
    function hideTitleToolbar () {
        hideElement(titleToolbar);
    }
    
    function preventReturnKey (event) {
        var code = (event.keyCode || event.which);
        if (code == 13) {
            event.preventDefault(); 
            return false; 
        }
    }
}

function unsetEditorMode (resetValues) {
    hideElement(gState.container.querySelector('.ebl-editor-toolbar'));
    
    if (!isNullOrUndef(lState.editors)) {
        var titleEditor = lState.editors.title;
        var contentEditor = lState.editors.content;
        
        // unset title
        titleEditor.blur();
        titleEditor.contentEditable = false;
        removeClass(titleEditor, 'ebl-editable');
        if (resetValues && !isNullOrUndef(titleEditor.oldValue)) titleEditor.innerHTML = titleEditor.oldValue;            
        deleteProperty(titleEditor, 'oldValue');
        
        // unset content
        contentEditor.destroy();
        removeClass(contentEditor.editableElement, 'ebl-editable');
        
        lState.editors = null;
    }
}

function saveCurrentEditedPost(isDraft) {
    if (isNullOrUndef(lState.editors)) {
        logError('there is no active editor.');
        return;
    }
        
    var titleElem = lState.editors.title;
    titleElem.oldValue = titleElem.innerHTML;
    var title = encodeURIComponent(safeTags((titleElem.textContent || titleElem.innerText).trim()));
    if (title.length === 0) {
        showPopup(PopupType.ERROR, l18n_("Title is missing!"));
        return;
    }
    
    var contentEditor = lState.editors.content;
    if (contentEditor.currentView == 'source') {
        contentEditor.fire('change_view', 'composer');
    }
    
    var content = encodeURIComponent(contentEditor.getValue());
    var contentElem = contentEditor.editableElement;
    contentElem.oldValue = contentElem.innerHTML;
    
    if (isNullOrUndef(lState.post.tags)) lState.post.tags = [];
    var tags = JSON.stringify(lState.post.tags);
    
    var publishAsNew = lState.post.status === PostStatus.NEW;
    var action = (publishAsNew ? 
        'action=publish_post&title='+ title +'&body='+ content +'&tags='+ tags +'&draft='+ (isDraft ? 1 : 0) : 
        'action=update_post&id='+ lState.post.id +'&title='+ title +'&body='+ content +'&tags='+ tags +'&draft='+ (isDraft ? 1 : 0)
    );
    action += '&token=' + gState.authToken;
    
    sendRequest(
        ApiType.DATA, 
        action, 'POST', true,
        function () { showLoadingOverlay(); },
        function (res) {
            hideLoadingOverlay();
            var id = res.meta.id;
            lState.post.id = id;
            lState.post.status = isDraft ? PostStatus.DRAFT : PostStatus.PUBLISHED;
            
            if (!isDraft) {
                unsetEditorMode();
                openPost(id, publishAsNew);
            }
            
            if (isDraft) showPopup(PopupType.SUCCESS, l18n_("Draft saved"));
            else if (publishAsNew) showPopup(PopupType.SUCCESS, l18n_("Published!"));
            else showPopup(PopupType.SUCCESS, l18n_("Updated!"));
        },
        function (code, msg) {
            hideLoadingOverlay();
            showPopup(PopupType.FATAL, 'I can\'t publish this document: ' + safeTags(msg));
        }
    );
}

/* ********************* GUI ***********************
 * Functions to manipulate the visual interface
 * *************************************************/

// define the ebl-template and other HTML5 elements for old browsers
document.createElement('ebl-template');
document.createElement('header');
document.createElement('time');
document.createElement('nav');
document.createElement('article');
      
function showPostSection(postId, andEdit) {
    unsetEditorMode();
    
    sendRequest (
        ApiType.RENDER,
        'action=get_post&id='+ postId + toUrlParameters(gState.config, 'template'),
        'GET', true,
        function() { showLoadingOverlay(); },
        function(res) {
            hideLoadingOverlay();

            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', res);
            
            var newTemplate = c.querySelector('ebl-template');
            var p = lState.post;
            p.id = getDataAttribute(newTemplate, 'eblPostId');
            p.status = PostStatus.parse(getDataAttribute(newTemplate, 'eblPostStatus'));
            p.title = getDataAttribute(newTemplate, 'eblPostTitle');
            p.createdAt = parseDatetimeFromString(getDataAttribute(newTemplate, 'eblPostCreatedat'));
            p.updatedAt = parseDatetimeFromString(getDataAttribute(newTemplate, 'eblPostUpdatedat'));
            p.tags = parseTagsFromString(getDataAttribute(newTemplate, 'eblPostTags'));
            
            activateScripts(newTemplate);
            enablePostLinks(newTemplate);
            enableNavLinks(newTemplate);
            
            setHistoryTitle(p.title);
            
            if (andEdit === true) switchToEditorMode();
            refreshAdminBarMode();
            
            var onPostOpened = gState.config.onPostOpened;
            if (typeof onPostOpened == 'function') {
                onPostOpened(postId);
            }
        },
        function(code, msg) {
            hideLoadingOverlay();
            
            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', msg);
        }
    );
}

function showNewPostSection() {
    sendRequest(
        ApiType.RENDER, 
        'action=get_html&ebl-new=1' + toUrlParameters(gState.config, 'template'),
        'GET', true,
        function() { showLoadingOverlay(); },
        function(data) {
            hideLoadingOverlay();
            
            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', data);
            
            var newTemplate = c.querySelector('ebl-template');
            var p = lState.post;
            p.status = PostStatus.NEW;
            
            var comments = newTemplate.querySelectorAll('.ebl-comments');
            for (var i = 0; i < comments.length; ++i) removeElement(comments[i]);
            
            activateScripts(newTemplate);
            enablePostLinks(newTemplate);
            enableNavLinks(newTemplate);
            
            setHistoryTitle(l18n_("Title here..."));
            
            switchToEditorMode();
            refreshAdminBarMode();
        },
        function(code, msg) {
            hideLoadingOverlay();
            
            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', msg);
        }
    );
}

function showPreviewSection() {
    unsetEditorMode();
    
    sendRequest(
        ApiType.RENDER, 
        'action=get_page&number='+ lState.page + toUrlParameters(gState.config, 'template', 'postsPerPage'),
        'GET', true,
        function() { showLoadingOverlay(); },
        function(data) {
            hideLoadingOverlay();
            
            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', data);
            
            var newTemplate = c.querySelector('ebl-template');
            lState.page = parseInt(getDataAttribute(newTemplate, 'eblPageNum'), 0);
            deleteProperty(lState, 'post');
            
            activateScripts(newTemplate);
            enablePostLinks(newTemplate);
            enableNavLinks(newTemplate);
            
            setHistoryTitle(null);
            refreshAdminBarMode();
            
            var onPageChanged = gState.config.onPageChanged;
            if (typeof onPageChanged == 'function') {
                onPageChanged(lState.page);
            }
        },
        function(code, msg) {
            hideLoadingOverlay();
            
            var c = gState.container;
            removeElement(c.querySelector('ebl-template'));
            c.insertAdjacentHTML('beforeend', msg);
        }
    );
}

function enablePostLinks(elem) {
    var links = elem.querySelectorAll('.ebl-post-link');
    for (var i = 0; i < links.length; i++) {
        var thisLink = links[i];
        if (thisLink.tagName !== 'A') {
            logWarning('found a post link but it\'s not an <a> tag! seamless navigation is disabled.');
            continue;
        }
        
        thisLink.onclick = function (event) {
            event = event || window.event;            
            event.preventDefault ? event.preventDefault() : event.returnValue = false;
            
            var href = (event.target || event.srcElement).href;
            
            var docBody = (document.documentElement || document.body);
            animate(docBody, 'scrollTop', '', true, docBody.scrollTop, gState.container.offsetTop - 40, 400, function () {
                openPost(href.substring(href.lastIndexOf('?ebl-post=') + '?ebl-post='.length), false);
            });
        };
    }
}

function enableNavLinks(elem) {
    var links = elem.querySelectorAll('.ebl-nav-link');
    for (var i = 0; i < links.length; i++) {
        var thisLink = links[i];
        if (thisLink.tagName !== 'A') {
            logWarning('found a nav link but it\'s not an <a> tag! seamless navigation is disabled for it.');
            continue;
        }
        
        thisLink.onclick = function (event) {
            event = event || window.event;
            event.preventDefault ? event.preventDefault() : event.returnValue = false;
            
            var href = (event.target || event.srcElement).href;
            
            var eblState = {};
            eblState.page = parseInt(href.substring(href.lastIndexOf('?ebl-page=') + '?ebl-page='.length), 10);
            
            var newParams = addUrlParam(window.location.search, 'ebl-page', eblState.page);
            newParams = removeUrlParam(newParams, 'ebl-post');
            
            var docBody = (document.documentElement || document.body);
            animate(docBody, 'scrollTop', '', true, docBody.scrollTop, gState.container.offsetTop - 40, 400, function () {
                changeHistoryState(eblState, null, newParams);
                showPreviewSection();
            });
        };
    }
}

function setAdminMode() {
    var adminBar = gState.container.querySelector('.ebl-adminbar');
    
    if (gState.isAdmin) {
        refreshAdminBarMode();
        showElement(adminBar);
    }
    else {
        unsetEditorMode();
        hideElement(adminBar);
    }
}


function showInitRepoDialog() {
    if (gState.isAdmin) {
        logError('can\'t show dialog, admin already exists and it\'s logged.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        var cancelButton = alert.elements.footer.querySelector('button.ajs-cancel');
        hideElement(cancelButton);
        
        alert.set({
            'title' : l18n_("Welcome to Ebl!"),
            'message' : l18n_("Everything is ready to put some contents on your blog. But first, you need a passphrase! Create it here:"),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : l18n_("Ok") },
            'type' : 'password',
            'value' : '',
            'onok' : function(ev, value) { callback (value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(l18n_("Everything is ready to put some contents on your blog. But first, you need a passphrase! Create it here:"), '');
        if (psw) callback(psw);
    }
    
    function callback(value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, l18n_("Choose a longer passphrase, it's worth it!"));
            return;
        }
        
        sendRequest(
            ApiType.DATA, 
            'action=init_repository&psw=' + value,
            'POST', true,
            null,
            function(res) {
                if (alert) alert.close();
                gState.isAdmin = true;
                gState.authToken = res.data.attributes.token;
                
                showPopup(PopupType.SUCCESS, l18n_("Admin created, bring it on!"));
                setAdminMode();
            },
            function(code, msg) {
                showPopup(PopupType.FATAL, 'can\'t initialize database: ' + msg);
            }
        );
    }
}

function showLoginDialog() {
    if (gState.isAdmin) {
        logWarning('already logged in.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        alert.set({
            'title' : l18n_("Restricted area"),
            'message' : l18n_("Are you the master? Type the passphrase:"),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'type' : 'password',
            'value' : '',
            'onok' : function (ev, value) { callback(value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(l18n_("Are you the master? Type the passphrase:"), '');
        if (psw) callback(psw);
    }
    
    function callback (value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, l18n_("Wrong passphrase :("));
            return;
        }
        
        sendRequest(
            ApiType.DATA, 
            'action=log_in&psw=' + value,
            'POST', true,
            null,
            function(res) {
                gState.isAdmin = true;
                gState.authToken = res.data.attributes.token;
                
                showPopup(PopupType.SUCCESS, l18n_("You have been logged in!"));
                if (alert) alert.close();
                
                setAdminMode();
                if (isNullOrUndef(lState.post)) openPreviews();
            },
            function (code, msg) {
                if (code === ApiResult.EBL_ERROR_AUTH_SHORTACCESS) { }
                else if (code === ApiResult.EBL_ERROR_AUTH_NOTLOGGED) {
                    showPopup(PopupType.ERROR, l18n_("Wrong passphrase :("));
                }
                else {
                    var fullMsg = 'login error: ' + msg;
                    if (alert) alert.close();
                    showPopup(PopupType.FATAL, fullMsg);
                    logError(msg);
                }
            }
        );
    }
}

function showLogoutDialog() {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, user already logged out.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': l18n_("Really log out?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("Really log out?"));
        if (c) callback();
    }
    
    function callback () {
        sendRequest(
            ApiType.DATA, 
            'action=log_out',
            'POST', true,
            function() { showLoadingOverlay(); },
            function(res) {
                hideLoadingOverlay();
                gState.isAdmin = false;
                gState.authToken = null;
                
                setAdminMode();
                if (!isNullOrUndef(lState.post)) {
                    var postElem = gState.container.querySelector('.ebl-post-singleview#ebl-post_' + lState.post.id);
                    if (hasClass(postElem, 'ebl-draft')) openPreviews();
                }
                else openPreviews();
            },
            function (code, msg) {
                hideLoadingOverlay();
                showPopup(PopupType.FATAL, msg);
            }
        );
    }
}

function showDeleteDialog(postId) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': l18n_("Do you really want to delete this post?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("Do you really want to delete this post?"));
        if (c) callback();
    }
    
    function callback () {
        sendRequest(
            ApiType.DATA, 
            'action=delete_post&id=' + postId + '&token=' + gState.authToken,
            'POST', true,
            function() { showLoadingOverlay(); },
            function(res) {
                hideLoadingOverlay();
                showPopup(PopupType.SUCCESS, l18n_("Post deleted"));
                
                deleteProperty(lState.post);
                showPreviewSection();
            },
            function(code, msg) {
                hideLoadingOverlay();
                showPopup(PopupType.FATAL, 'error while deleting: ' + msg);
            }
        );
    }
}

function showReDraftDialog(onOk) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': l18n_("This will take this post back to a draft status, are you sure?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': onOk
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("This will take this post back to a draft status, are you sure?"));
        if (c) onOk();
    }
}

function showTagsDialog(defaultValue, onDone) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        var inputField = alert.elements.body.querySelector('input.ajs-input');
        inputField.placeholder = l18n_("e.g.: biscuits, coffee lovers, the-number-42");
        
        alert.set({
            'title' : l18n_("Tags"),
            'message' : l18n_("Write down a list of tags for this post, separated by comma. Only letters and numbers are allowed and spaces will be replaced with the \"-\" character."),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'type' : 'text',
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'value' : defaultValue,
            'onok' : function(ev, value) { onDone(value); }
        });
        alert.show();
    }
    else {
        var tags = prompt(l18n_("Write down a list of tags for this post, separated by comma. Only letters and numbers are allowed and spaces will be replaced with the \"-\" character."));
        if (tags) onDone(tags);
    }
}


function showLoadingOverlay() {
    var c = gState.container;
    var overlay = c.querySelector('.ebl-loading-overlay');
    if (isNullOrUndef(overlay)) {
        overlay = document.createElement('div');
        addClass(overlay, 'ebl-loading-overlay', 'ebl-unselectable');
        var spinner = document.createElement('div');
        addClass(spinner, 'ebl-icon-gear', 'ebl-icon-spin', 'ebl-icon-4x');
        
        overlay.appendChild(spinner);
        prependTo(c, overlay);
    }
    
    c.style.position = 'relative';
    addClass(overlay, 'visible');
}

function hideLoadingOverlay() {
    var c = gState.container;
    var overlay = c.querySelector('.ebl-loading-overlay');
    c.style.position = 'static';
    removeClass(overlay, 'visible');
}

var PopupType = {
    FATAL: 0,
    ERROR: 1,
    SUCCESS: 2
};

function showPopup(type, text) {
    if (type == PopupType.SUCCESS) {
        if (hasAlertify()) alertify.success(text); else alert(text);
    }
    else if (type == PopupType.ERROR) {
        if (hasAlertify()) alertify.error(text); else alert(text);
    }
    else if (type == PopupType.FATAL) {
        if (hasAlertify()) alertify.alert('', '<p class="ebl-error">' + eblLang.general_fatalError + '</p><pre class="ebl-pre">' + text + '</pre>'); 
        else alert(text);
    }
}



function buildAdminBar () {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-adminbar', 'ebl-unselectable');
    
    bar.origDisplay = 'block';
    bar.style.display = 'none';
            
    // 'add new' container
    var newContainer = document.createElement('div');
    addClass(newContainer, 'ebl-adminbar-new');
    
    var addNew = createButton('ebl-action-new');
    addClass(addNew, 'ebl-icon-2x', 'ebl-icon-plus-square');
    addNew.onclick = function() {
        openCreateNew();
    };
    
    newContainer.appendChild(
        addTooltipTo(addNew, l18n_("Write something new"))
    );
    
    // 'edit' container
    var editContainer = document.createElement('div');
    addClass(editContainer, 'ebl-adminbar-edit');
    
    var editPost = createButton('ebl-action-edit');
    addClass(editPost, 'ebl-icon-2x', 'ebl-icon-pencil-square');
    editPost.onclick = function() {
        var newState = clone(lState);
        newState.post.edit = true;
        var newParams = addUrlParam(window.location.search, 'ebl-edit', '1');
        changeHistoryState(newState, null, newParams);
        
        switchToEditorMode();
        refreshAdminBarMode();
    };
    
    var deletePost = createButton('ebl-action-delete');
    addClass(deletePost, 'ebl-icon-2x', 'ebl-icon-trash');
    deletePost.onclick = function () {
        showDeleteDialog(lState.post.id);
    };
    
    editContainer.appendChild(addTooltipTo(editPost, l18n_("Edit this post")));
    editContainer.appendChild(addTooltipTo(deletePost, l18n_("Delete this post")));
    
    // 'save / cancel' container
    var publishContainer = document.createElement('div');
    addClass(publishContainer, 'ebl-adminbar-publish');
    
    var saveDraft = createButton('ebl-action-save');
    addClass(saveDraft, 'ebl-icon-2x', 'ebl-icon-floppy');
    saveDraft.onclick = function () {
        if (lState.post.status == PostStatus.PUBLISHED) showReDraftDialog(function () { saveCurrentEditedPost(true); });
        else saveCurrentEditedPost(true);
    };
    
    var publishPost = createButton('ebl-action-publish');
    addClass(publishPost, 'ebl-icon-2x', 'ebl-icon-upload');
    publishPost.onclick = function () {
        saveCurrentEditedPost(false);
    };
    
    var cancelEdit = createButton('ebl-action-cancel');
    addClass(cancelEdit, 'ebl-icon-2x', 'ebl-icon-close');
    cancelEdit.onclick = function () {
        unsetEditorMode(true);
        goHistoryBack();
    };
    
    publishContainer.appendChild(addTooltipTo(saveDraft, l18n_("Save as draft")));
    publishContainer.appendChild(addTooltipTo(publishPost, l18n_("Publish now")));
    publishContainer.appendChild(addTooltipTo(cancelEdit, l18n_("Cancel")));
    
    // 'logout' button
    var logOut = createButton('ebl-action-logout');
    addClass(logOut, 'ebl-icon-2x', 'ebl-icon-sign-out');
    logOut.onclick = function() {
        showLogoutDialog();
    };
    
    bar.appendChild(newContainer);
    bar.appendChild(editContainer);
    bar.appendChild(publishContainer);
    bar.appendChild(logOut);
    
    prependTo(gState.container, bar);
    refreshAdminBarMode();
}

function refreshAdminBarMode() {
    var c = gState.container;
    var newContainer = c.querySelector('.ebl-adminbar-new');
    var publishContainer = c.querySelector('.ebl-adminbar-publish');
    var editContainer = c.querySelector('.ebl-adminbar-edit');
    
    if (isNullOrUndef(lState.post)) { // "CREATE NEW" mode
        showElement(newContainer);
        hideElement(publishContainer);
        hideElement(editContainer);
    }
    else if (lState.post.edit === true) { // "EDITING" mode
        hideElement(newContainer);
        showElement(publishContainer);
        hideElement(editContainer);
    }
    else { // "SINGLE POST" mode
        hideElement(newContainer);
        hideElement(publishContainer);
        showElement(editContainer);
    }
}

function buildEditorToolbar() {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-toolbar', 'ebl-editor-toolbar');
    
    var separator = document.createElement('span');
    addClass(separator, 'ebl-separator');
    
    var format = document.createElement('div');
    
    var undo = createButton('ebl-action-editor-undo', l18n_("Undo"));
    addClass(undo, 'ebl-icon-rotate-left');
    setDataAttribute(undo, 'wysihtmlCommand', 'undo');
    
    var textBold = createButton('ebl-action-editor-bold', l18n_("Bold"));
    addClass(textBold, 'ebl-icon-bold');
    setDataAttribute(textBold, 'wysihtmlCommand', 'bold');
    
    var textItalic = createButton('ebl-action-editor-italic', l18n_("Italic"));
    addClass(textItalic, 'ebl-icon-italic');
    setDataAttribute(textItalic, 'wysihtmlCommand', 'italic');
    
    var textUnderline = createButton('ebl-action-editor-underline', l18n_("Underline"));
    addClass(textUnderline, 'ebl-icon-underline');
    setDataAttribute(textUnderline, 'wysihtmlCommand', 'underline');
    
    var textH1 = createButton('ebl-action-editor-h1', l18n_("H1"));
    addClass(textH1, 'ebl-icon-header');
    setDataAttribute(textH1, 'wysihtmlCommand', 'formatBlock');
    setDataAttribute(textH1, 'wysihtmlCommandValue', 'h1');
    
    var alignLeft = createButton('ebl-action-editor-alignleft', l18n_("Align left"));
    addClass(alignLeft, 'ebl-icon-align-left');
    setDataAttribute(alignLeft, 'wysihtmlCommand', 'justifyLeft');
    
    var alignCenter = createButton('ebl-action-editor-aligncenter', l18n_("Align center"));
    addClass(alignCenter, 'ebl-icon-align-center');
    setDataAttribute(alignCenter, 'wysihtmlCommand', 'justifyCenter');
    
    var alignRight = createButton('ebl-action-editor-alignright', l18n_("Align right"));
    addClass(alignRight, 'ebl-icon-align-right');
    setDataAttribute(alignRight, 'wysihtmlCommand', 'justifyRight');
    
    var addUl = createButton('ebl-action-editor-addul', l18n_("Unordered list"));
    addClass(addUl, 'ebl-icon-list-ul');
    setDataAttribute(addUl, 'wysihtmlCommand', 'insertUnorderedList');
    
    var addOl = createButton('ebl-action-editor-addol', l18n_("Ordered list"));
    addClass(addOl, 'ebl-icon-list-ol');
    setDataAttribute(addOl, 'wysihtmlCommand', 'insertOrderedList');
    
    var addImage = createButton('ebl-action-editor-addimage', l18n_("Add image"));
    addClass(addImage, 'ebl-icon-image');
    setDataAttribute(addImage, 'wysihtmlCommand', 'insertImage');
    
    var addLink = createButton('ebl-action-editor-addlink', l18n_("Add link"));
    addClass(addLink, 'ebl-icon-chain');
    setDataAttribute(addLink, 'wysihtmlCommand', 'createLink');
    
    var showHtml = createButton('ebl-action-editor-html', l18n_("Edit HTML"));
    addClass(showHtml, 'ebl-icon-file-code');
    setDataAttribute(showHtml, 'wysihtmlAction', 'change_view');
    
    format.appendChild(undo);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(textBold);
    format.appendChild(textItalic);
    format.appendChild(textUnderline);
    format.appendChild(textH1);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(alignLeft);
    format.appendChild(alignCenter);
    format.appendChild(alignRight);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(addUl);
    format.appendChild(addOl);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(addImage);
    format.appendChild(addLink);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(showHtml);
    
    var image = document.createElement('div');
    setDataAttribute(image, 'wysihtmlDialog', 'insertImage');
    addClass(image, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var imageSrc = document.createElement('input');
    setDataAttribute(imageSrc, 'wysihtmlDialogField', 'src');
    imageSrc.type = 'text';
    imageSrc.value = 'http://';
    
    var imageSrcSave = createButton('ebl-action-editor-image-save', l18n_("Add image"));
    imageSrcSave.innerHTML = l18n_("Add image");
    setDataAttribute(imageSrcSave, 'wysihtmlDialogAction', 'save');
    
    image.appendChild(imageSrc);
    image.appendChild(imageSrcSave);
    hideElement(image);
    
    var link = document.createElement('div');
    setDataAttribute(link, 'wysihtmlDialog', 'createLink');
    addClass(link, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var linkUrl = document.createElement('input');
    setDataAttribute(linkUrl, 'wysihtmlDialogField', 'href');
    linkUrl.type = 'text';
    linkUrl.value = 'http://';
    
    var linkUrlSave = createButton('ebl-action-editor-link-save', l18n_("Add link"));
    linkUrlSave.innerHTML = l18n_("Add link");
    setDataAttribute(linkUrlSave, 'wysihtmlDialogAction', 'save');
    
    link.appendChild(linkUrl);
    link.appendChild(linkUrlSave);
    hideElement(link);
    
    bar.appendChild(format);
    bar.appendChild(image);
    bar.appendChild(link);
    
    bar.style.visibility = 'hidden';
    prependTo(gState.container, bar);
    
    return bar;
}

function buildTitleToolbar() {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-toolbar', 'ebl-title-toolbar');
    
    var tags = createButton('ebl-action-title-tag',  l18n_("Tags"));
    addClass(tags, 'ebl-icon-tags');
    tags.onmousedown = function() {
        showTagsDialog(printTagsFromArray(lState.post.tags), function (newTags) {
            lState.post.tags = parseTagsFromString(newTags);
        });
    };
    
    bar.appendChild(tags);
    
    bar.style.visibility = 'hidden';
    prependTo(gState.container, bar);
    
    return bar;
}

/* ****************** HISTORY API ****************** 
 * Enables a seamless navigation using History API
 * *************************************************/

var hasPreviousHistory = false;

function setHistoryListener() {
    if (!isHistorySupported()) {
        logWarning('this browser does not support History API. seamless navigation is disabled.');
        return;
    }
    
    bindToEvent(window, 'popstate', function(e) {
        // retrieve the previous state, if present, then change the view accordingly
        if (e.state && e.state.hasOwnProperty('ebl')) {
            lState = e.state.ebl;
            if (isNullOrUndef(lState.post)) showPreviewSection();
            else if (lState.post.status === PostStatus.NEW) showNewPostSection();
            else showPostSection(lState.post.id, lState.post.edit);
        }
    }, false);
}

function changeHistoryState(data, title, query, replace) {
    if (isHistorySupported()) {
        var newState = history.state;
        if (isNullOrUndef(newState)) newState = {};
        newState.ebl = lState = data;
        replace ? history.replaceState(newState, null, query) : history.pushState(newState, null, query);
    }
    else if (!replace) window.location.search = query;
    
    if (!replace) hasPreviousHistory = true;
}

/**
 * Simply goes back in history
 * @param {number} count - History steps
 */
function goHistoryBack(count) {
    if (!hasPreviousHistory) showPreviewSection();
    else window.history.back(count);
}

/**
 * Changes the page title (without refreshing) accordingly to the 
 * current 'pageTitleFormat' config value
 * @param {string} t - The new title
 */
function setHistoryTitle(t) {
    if (isNullOrUndef(gState.config.pageTitleFormat)) return;
    
    var dTitle = gState.docTitle;
    var fTitle = null;
    if (!isNullOrUndef(t)) {
        fTitle = gState.config.pageTitleFormat
            .replace(/{doc_title}/g, dTitle)
            .replace(/{ebl_title}/g, safeTags(t));
    }
    else fTitle = dTitle;
    
    try { document.getElementsByTagName('title')[0].innerHTML = fTitle; } 
    catch ( Exception ) { }
    document.title = fTitle;
}

/**
 * Returns TRUE if History API is supported by this browser
 */
function isHistorySupported() {
    return !!(window.history && history.pushState);
}

// These two object contain information about the state of Ebl

var GlobalState = Base.extend({
    constructor: function() {
        this.isAdmin = false;
        this.authToken = null;
        this.docTitle = null;
        this.container = null;
        
        // default config
        this.config = {
            template: 'default',
            language: 'en',
            postsPerPage: 5,
            pageTitleFormat: "{ebl_title} | {doc_title}",
            
            // callbacks
            onBlogLoaded: null,
            onPostOpened: null,
            onPageChanged: null
        };
    }
});

var LocalState = Base.extend({
    constructor: function() {
        this.page = 0;
        this.post = null;
        this.editors = null;
    }
});

var PostStatus = {
    NEW: 0,
    DRAFT: 1,
    PUBLISHED: 2,
    
    parse: function (s) {
        if (s.toLowerCase() == "new") return 0;
        if (s.toLowerCase() == "draft") return 1;
        if (s.toLowerCase() == "published") return 2;
        return null;
    }
};

var gState = new GlobalState();    // state shared among the entire session
var lState = new LocalState();     // state of the current view
}(window));