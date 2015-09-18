/** Adds all the given files as dependencies in the Document.
 * Supported formats: JS and CSS.
 * @param {Object} list - An array of dependecy information. Every element is an object structured like this:
 *                        { type : "<js/css>", url : "<url of the resource>"};
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
        include(list[i].url, list[i].type, includeCallback); 
        i++;
    }
    
    function includeCallback (url) {
        logDebug(url + ' loaded');
        if (++count == total) onDone();
    }
    
    function include(url, t, callback) {
        var elem;
        
        if (t === 'css') {
            elem = document.createElement('link');
            elem.rel = 'stylesheet';
            elem.type = 'text/css';
            elem.href = url;
            if (typeof callback === 'function') callback(url);
        }
        else if (t === 'js') {
            elem = document.createElement('script');
            elem.type = 'text/javascript';
            
            if (elem.readyState) {
                elem.onreadystatechange = function() {
                    if (elem.readyState == 'loaded' || elem.readyState == 'complete') {
                        elem.onreadystatechange = null;
                        if (typeof callback === 'function') callback(url);
                    }
                };
            } else {
                elem.onload = function() {
                    if (typeof callback === 'function') callback(url);
                };
                elem.onerror = function() {
                    logError('error loading ' + url);
                };
            }
            
            elem.src = url;
        }
        
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(elem);
    }
}
