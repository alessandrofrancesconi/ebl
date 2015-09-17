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
