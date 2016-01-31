var editorDepLoad = 0;

function switchToEditorMode () {
    if (!gState.isAdmin) {
        logError('can\'t open editor, admin not logged');
        return;
    }
    
    if (typeof wysihtml5 === 'undefined') {
        
        if (editorDepLoad >= 1) {
            logError('error loading editor library.');
            return;
        }
        else editorDepLoad ++;
        
        logDebug('editor library not yet loaded. perform loading now...');
        var dependencies = [];
        dependencies.push({url: scriptPath + '/libs/wysihtml/wysihtml-toolbar.min.js', type: 'js'});
        
        includeDependencies(dependencies, function() {
            dependencies = [];
            dependencies.push({url: scriptPath + '/libs/wysihtml/parser_rules/advanced_and_extended.js', type: 'js'});
            includeDependencies(dependencies, function() { switchToEditorMode(); }); });
        
        return;
    }
    
    initEditors();
}

function initEditors() {        
    var editorInstances = {};
    
    var postElem = gState.container.querySelector(
        lState.post.status === PostStatus.NEW ? 
            '.ebl-post-new' :
            '.ebl-post-singleview#ebl-post_' + lState.post.id
    );
    
    var titleElem = postElem.querySelector('.ebl-post-title');
    addClass(titleElem, 'ebl-editable');
    titleElem.contentEditable = true;
    if (lState.post.status === PostStatus.NEW) titleElem.innerHTML = eblLang.editor_placeholder_title;
    else titleElem.oldValue = titleElem.innerHTML;
    
    var titleToolbar = gState.container.querySelector('.ebl-title-toolbar');
    if (isNullOrUndef(titleToolbar)) titleToolbar = buildTitleToolbar();
    
    editorInstances.title = titleElem;
    bindToEvent(editorInstances.title, 'keypress', preventReturnKey);
    bindToEvent(editorInstances.title, 'focus', showTitleToolbar);
    bindToEvent(editorInstances.title, 'blur', hideTitleToolbar);
    
    var contentElem = postElem.querySelector('.ebl-post-body');
    addClass(contentElem, 'ebl-editable');
    contentElem.oldValue = contentElem.innerHTML;
            
    var editorToolbar = gState.container.querySelector('.ebl-editor-toolbar');
    if (isNullOrUndef(editorToolbar)) editorToolbar = buildEditorToolbar();
    
    editorInstances.content = new wysihtml5.Editor(contentElem, {
        name: 'ebl-editor-body',
        style: false,
        showToolbarAfterInit: false,
        parserRules: wysihtml5ParserRules,
        uneditableContainerClassname: false,
        useLineBreaks: false,
        toolbar: editorToolbar
    });
    
    if (lState.post.status === PostStatus.NEW) editorInstances.content.setValue('<p>' + eblLang.editor_placeholder_content + '</p>');
    editorInstances.content.on('newword:composer', moveToolbar);
    editorInstances.content.on('show:dialog', function () { addClass(editorToolbar, 'ebl-sticky'); } );
    editorInstances.content.on('cancel:dialog', function () { removeClass(editorToolbar, 'ebl-sticky'); } );
    editorInstances.content.on('blur', hideToolbar);        
    editorInstances.content.on('change_view', switchHtmlToolbar);
    bindToEvent(contentElem, 'click', moveToolbar);
    
    lState.editors = editorInstances;
    
    if (lState.post.status === PostStatus.NEW) {
        var comments = postElem.querySelectorAll('.ebl-comments');
        for (var i = 0; i < comments.length; ++i) removeElement(comments[i]);
    }
    
    function moveToolbar (event, stayOnTop) {
        if (!isNullOrUndef(event) && isNullOrUndef(lState.editors)) {
            (event.target || event.srcElement).removeEventListener('click', this);
            return false;
        }
        
        var left = null, top = null;
        var docElem = document.documentElement;
        var screenWidth = Math.max(docElem.clientWidth, window.innerWidth || 0);
        
        if (isMobile() || stayOnTop) {
            var editorBounds = contentElem.getBoundingClientRect();
            left = editorBounds.left + ((contentElem.offsetWidth / 2) - editorToolbar.offsetWidth / 2);
            top = editorBounds.top - editorToolbar.offsetHeight - 5;
        }
        else {
            var caretPos = null, range = null;
            if (document.selection && document.selection.createRange){
                range = document.selection.createRange();
                caretPos = { top: range.offsetTop, left: range.offsetLeft };
            } else if (window.getSelection && window.getSelection().rangeCount > 0){
                range = window.getSelection().getRangeAt(0).cloneRange();
                var bounds = range.getBoundingClientRect();
                caretPos = { top: bounds.top, left: bounds.left };
            }
            
            if (!isNullOrUndef(caretPos)) {
                var centerWidth = (editorToolbar.offsetWidth / 2);
                left = caretPos.left - centerWidth + 5;
                if (left < 5) {
                    left = 5;
                }
                else if (left > screenWidth - centerWidth - 5) {
                    left = screenWidth - centerWidth - 5;
                }
                
                top = caretPos.top - editorToolbar.offsetHeight - 20;
            }
        }
        
        if (left !== null || top !== null) {
            // fix scroll
            var screenScrollLeft = (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0);
            var screenScrollTop = (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop || 0);
            left += screenScrollLeft;
            top += screenScrollTop;
            
            var isValid = true;
            var prevLeft = parseInt(editorToolbar.style.left, 10);
            if (isNaN(prevLeft)) isValid = false;
            var prevTop = parseInt(editorToolbar.style.top, 10);
            if (isNaN(prevTop)) isValid = false;
            
            editorToolbar.style.visibility = 'visible';
            if (isValid) {
                animate(editorToolbar, 'left', 'px', false, Math.ceil(prevLeft), Math.ceil(left), 300);
                animate(editorToolbar, 'top', 'px', false, Math.ceil(prevTop), Math.ceil(top), 300);
            }
            else {
                editorToolbar.style.left = Math.ceil(left) + 'px';
                editorToolbar.style.top = Math.ceil(top) + 'px';
            }
            
            return true;
        }
        else {
            hideToolbar();
            return false;
        }
    }
    
    function hideToolbar () {
        if (!hasClass(editorToolbar, 'ebl-sticky')) {
            hideElement(editorToolbar);
        }
    }
    
    function switchHtmlToolbar (event) {
        var isHtml = (event === 'textarea');
        var elements = editorToolbar.querySelectorAll('.ebl-button, .ebl-separator');
        
        for (var i = 0; i < elements.length; i++) {
            isHtml ? hideElement(elements[i]) : showElement(elements[i]) ;
        }
        
        var buttonHtml = editorToolbar.querySelector('.ebl-action-editor-html');
        if (isHtml) {
            removeClass(buttonHtml, 'ebl-icon-file-code-o');
            addClass(buttonHtml, 'ebl-icon-file-text-o', 'ebl-icon-2x');
            buttonHtml.title = eblLang.editor_toolbar_closeHTML;
            showElement(buttonHtml);
            
            addClass(editorToolbar, 'ebl-sticky');
        }
        else {
            removeClass(buttonHtml, 'ebl-icon-file-text-o', 'ebl-icon-2x');
            addClass(buttonHtml, 'ebl-icon-file-code-o');
            buttonHtml.title = eblLang.editor_toolbar_editHTML;
            
            removeClass(editorToolbar, 'ebl-sticky');
        }
        
        moveToolbar({}, true);
    }
    
    function showTitleToolbar () {
        var titleElem = lState.editors.title;
        var titleBounds = titleElem.getBoundingClientRect();
        var left = titleBounds.left + ((titleElem.offsetWidth / 2) - titleToolbar.offsetWidth / 2);
        var top = titleBounds.top - titleToolbar.offsetHeight - 5;
        
        var docElem = document.documentElement;
        var screenScrollLeft = (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0);
        var screenScrollTop = (window.pageYOffset || docElem.scrollTop)  - (docElem.clientTop || 0);
        left += screenScrollLeft;
        top += screenScrollTop;
        
        titleToolbar.style.left = Math.ceil(left) + 'px';
        titleToolbar.style.top = Math.ceil(top) + 'px';
        titleToolbar.style.visibility = 'visible';
        return true;
    }
    
    function hideTitleToolbar () {
        hideElement(titleToolbar);
    }
    
    function preventReturnKey (event) {
        var code = (event.keyCode || event.which);
        if (code == 13) {
            event.preventDefault(); 
            return false; 
        }
    }
}

function unsetEditorMode (resetValues) {
    hideElement(gState.container.querySelector('.ebl-editor-toolbar'));
    
    if (!isNullOrUndef(lState.editors)) {
        var titleEditor = lState.editors.title;
        var contentEditor = lState.editors.content;
        
        // unset title
        titleEditor.blur();
        titleEditor.contentEditable = false;
        removeClass(titleEditor, 'ebl-editable');
        if (resetValues && !isNullOrUndef(titleEditor.oldValue)) titleEditor.innerHTML = titleEditor.oldValue;            
        deleteProperty(titleEditor, 'oldValue');
        
        // unset content
        contentEditor.destroy();
        removeClass(contentEditor.editableElement, 'ebl-editable');
        
        lState.editors = null;
    }
}

function saveCurrentEditedPost(isDraft) {
    if (isNullOrUndef(lState.editors)) {
        logError('there is no active editor.');
        return;
    }
        
    var titleElem = lState.editors.title;
    titleElem.oldValue = titleElem.innerHTML;
    var title = encodeURIComponent(safeTags((titleElem.textContent || titleElem.innerText).trim()));
    if (title.length === 0) {
        showPopup(PopupType.ERROR, eblLang.editor_missingTitle);
        return;
    }
    
    var contentEditor = lState.editors.content;
    if (contentEditor.currentView == 'source') {
        contentEditor.fire('change_view', 'composer');
    }
    
    var content = encodeURIComponent(contentEditor.getValue());
    var contentElem = contentEditor.editableElement;
    contentElem.oldValue = contentElem.innerHTML;
    
    if (isNullOrUndef(lState.post.tags)) lState.post.tags = [];
    var tags = JSON.stringify(lState.post.tags);
    
    var publishAsNew = lState.post.status === PostStatus.NEW;
    var action = (publishAsNew ? 
        'action=publish_post&title='+ title +'&body='+ content +'&tags='+ tags +'&draft='+ (isDraft ? 1 : 0) : 
        'action=update_post&id='+ lState.post.id +'&title='+ title +'&body='+ content +'&tags='+ tags +'&draft='+ (isDraft ? 1 : 0)
    );
    action += '&token=' + gState.authToken;
    
    sendRequest(
        ApiType.DATA, 
        action, 'POST', true,
        function () { showLoadingOverlay(); },
        function (res) {
            hideLoadingOverlay();
            var id = res.meta.id;
            lState.post.id = id;
            lState.post.status = isDraft ? PostStatus.DRAFT : PostStatus.PUBLISHED;
            
            if (!isDraft) {
                unsetEditorMode();
                openPost(id, publishAsNew);
            }
            
            if (isDraft) showPopup(PopupType.SUCCESS, eblLang.editor_saved);
            else if (publishAsNew) showPopup(PopupType.SUCCESS, eblLang.editor_published);
            else showPopup(PopupType.SUCCESS, eblLang.editor_updated);
        },
        function (code, msg) {
            hideLoadingOverlay();
            showPopup(PopupType.FATAL, 'I can\'t publish this document: ' + safeTags(msg));
        }
    );
}