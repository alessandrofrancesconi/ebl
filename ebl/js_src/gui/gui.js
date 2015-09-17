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
            
            p.tags = [];
            var tagIds = getDataAttribute(newTemplate, 'eblPostTags').split(',');
            for (var i = 0; i < tagIds.length; ++i) {
                p.tags.push({ id: tagIds[i] });
            }
            
            activateScripts(newTemplate);
            enablePostLinks(newTemplate);
            enableNavLinks(newTemplate);
            
            setHistoryTitle(p.title);
            
            if (andEdit === true) switchToEditorMode();
            else changeAdminBarMode(AdminBarMode.EDIT_CURRENT);
            
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
            
            setHistoryTitle(eblLang.editor_placeholder_title);
            switchToEditorMode();
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
            
            activateScripts(newTemplate);
            enablePostLinks(newTemplate);
            enableNavLinks(newTemplate);
            
            setHistoryTitle(null);
            
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
    
    changeAdminBarMode(AdminBarMode.CREATE_NEW);
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
    
    if (gState.isAdmin) showElement(adminBar);
    else {
        unsetEditorMode();
        hideElement(adminBar);
    }
}
