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
