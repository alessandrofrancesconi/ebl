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