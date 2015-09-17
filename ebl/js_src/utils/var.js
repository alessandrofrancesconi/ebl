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

function parseTags(str) {
    var out = [];
    var tagIds = str.split(',');
    for (var i = 0; i < tagIds.length; ++i) {
        out.push({ id: tagIds[i] });
    }
    
    return out;
}