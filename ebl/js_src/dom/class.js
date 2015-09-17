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