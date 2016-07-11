/**
 * @license 
 * Ebl: the embeddable blog v@VERSION
 * @HOMEPAGE
 *
 * Author: @AUTHOR (@AUTHOMEPAGE)
 *
 * Copyright (C) @YEAR @AUTHOR
 * Licensed under the @LICENSE license
 *
 */
 
/*global alertify, wysihtml, wysihtmlParserRules, ActiveXObject*/
 
var Ebl = window.Ebl = {};
    Ebl.version = '@VERSION';

var DEBUG = @DEBUG;

// this script's location
var scripts = document.getElementsByTagName('script');
var scriptPath = scripts[scripts.length - 1].src.split('?')[0].split('/').slice(0, -1).join('/');

function bootUp () {
    var c = gState.container = document.querySelector('.ebl-container');
    if (isNullOrUndef(c)) return;
    
    gState.docTitle = document.title;
    var template = c.querySelector('ebl-template');
    
    var viewType = getDataAttribute(template, 'eblType');
    if (viewType == "page") {
        var page = parseInt(getDataAttribute(template, 'eblPageNum'), 10);
        lState.page = (isNaN(page) ? 0 : page);
    }
    else if (viewType == "post") {
        // there is a single post
        var post = {};
        post.status = PostStatus.parse(getDataAttribute(template, 'eblPostStatus'));
        
        if (post.status != PostStatus.NEW) {
            post.id = getDataAttribute(template, 'eblPostId');
            post.title = getDataAttribute(template, 'eblPostTitle');
            post.createdAt = parseDatetimeFromString(getDataAttribute(template, 'eblPostCreatedat'));
            post.updatedAt = parseDatetimeFromString(getDataAttribute(template, 'eblPostUpdatedat'));
            post.tags = parseTagsFromString(getDataAttribute(template, 'eblPostTags'));
            
            var eblEdit = getUrlParam(location.search, 'ebl-edit');
            if (eblEdit !== null && parseInt(eblEdit, 10) == 1) post.edit = true;
            
            setHistoryTitle(post.title);
        }
        else post.edit = true;
        
        lState.post = post;
    }
    
    // load all the dependencies
    var dependencies = [];
    if (gState.config.language != 'en') dependencies.push({url: scriptPath + '/languages/' + gState.config.language + '.js', type: 'js', required : false});
    dependencies.push({url: scriptPath + '/css/base.css', type: 'css', required : true});
    if (!hasAlertify() && !isBadBrowser()) {
        dependencies.push({url: scriptPath + '/libs/alertify/alertify.min.js', type: 'js', required : true});
        dependencies.push({url: scriptPath + '/libs/alertify/css/alertify.min.css', type: 'css', required : true});
        dependencies.push({url: scriptPath + '/libs/alertify/css/themes/default.min.css', type: 'css', required : false});
    }
    
    includeDependencies(dependencies, function() {            
        changeHistoryState(lState, null, null, true);
        setHistoryListener();
        
        buildAdminBar();
        
        var c = gState.container;
        activateScripts(c);
        enablePostLinks(c);
        enableNavLinks(c);
        
        sendRequest(
            ApiType.DATA, 
            'action=get_session', 
            'GET', true, 
            null,
            function(res) {
                gState.isAdmin = res.data.attributes.logged;
                if (gState.isAdmin === true) gState.authToken = res.data.attributes.token;
                setAdminMode();
                
                if (!isNullOrUndef(lState.post) && lState.post.edit) switchToEditorMode();
                if (window.location.hash == '#ebl-login') showLoginDialog();
            },
            function(code, error) {
                gState.isAdmin = false;
                gState.authToken = null;
                setAdminMode();
                
                if (code === ApiResult.EBL_ERROR_AUTH_NOADMIN) showInitRepoDialog();
                else {
                    var fullMsg = (code === ApiResult.EBL_ERROR_DB_ACCESS) ? 
                        'There is a problem connecting to the DB: ' + error.message :
                        'General error: ' + error.message;
                    
                    showPopup(PopupType.FATAL, fullMsg);
                }
            }
        );
        
        bindToEvent(window, 'beforeunload', function(e) {
            if (!isNullOrUndef(lState.editors)) {
                var message = l18n_("An editor is open. If you close the window, you will lose your changes.");
                e.returnValue = message; // Gecko, Trident, Chrome 34+
                return message;          // Gecko, WebKit, Chrome <34
            }
        });
        
        bindToEvent(window, 'hashchange', function(e) {
            if (window.location.hash == '#ebl-login') showLoginDialog();
        });
        
        var onBlogLoaded = gState.config.onBlogLoaded;
        if (typeof onBlogLoaded == 'function') onBlogLoaded();
    });
}