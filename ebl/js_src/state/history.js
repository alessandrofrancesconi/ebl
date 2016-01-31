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