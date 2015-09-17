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