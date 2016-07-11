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