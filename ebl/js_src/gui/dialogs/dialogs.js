function showInitRepoDialog() {
    if (gState.isAdmin) {
        logError('can\'t show dialog, admin already exists and it\'s logged.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        var cancelButton = alert.elements.footer.querySelector('button.ajs-cancel');
        hideElement(cancelButton);
        
        alert.set({
            'title' : eblLang.init_title,
            'message' : eblLang.init_message,
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : eblLang.general_ok },
            'type' : 'password',
            'value' : '',
            'onok' : function(ev, value) { callback (value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(eblLang.init_message, '');
        if (psw) callback(psw);
    }
    
    function callback(value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, eblLang.init_shortPassword);
            return;
        }
        
        sendRequest(
            ApiType.DATA, 
            'action=init_repository&psw=' + value,
            'POST', true,
            null,
            function(res) {
                if (alert) alert.close();
                gState.isAdmin = true;
                gState.authToken = res.data.attributes.token;
                
                showPopup(PopupType.SUCCESS, eblLang.init_ok);
                setAdminMode();
            },
            function(code, msg) {
                showPopup(PopupType.FATAL, 'can\'t initialize database: ' + msg);
            }
        );
    }
}

function showLoginDialog() {
    if (gState.isAdmin) {
        logWarning('already logged in.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        alert.set({
            'title' : eblLang.login_title,
            'message' : eblLang.login_message,
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : eblLang.general_ok },
            'type' : 'password',
            'value' : '',
            'onok' : function (ev, value) { callback(value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(eblLang.login_message, '');
        if (psw) callback(psw);
    }
    
    function callback (value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, eblLang.login_badPassword);
            return;
        }
        
        sendRequest(
            ApiType.DATA, 
            'action=log_in&psw=' + value,
            'POST', true,
            null,
            function(res) {
                gState.isAdmin = true;
                gState.authToken = res.data.attributes.token;
                
                showPopup(PopupType.SUCCESS, eblLang.login_ok);
                if (alert) alert.close();
                
                setAdminMode();
                if (isNullOrUndef(lState.post)) openPreviews();
            },
            function (code, msg) {
                if (code === ApiResult.EBL_ERROR_AUTH_SHORTACCESS) { }
                else if (code === ApiResult.EBL_ERROR_AUTH_NOTLOGGED) {
                    showPopup(PopupType.ERROR, eblLang.login_badPassword);
                }
                else {
                    var fullMsg = 'login error: ' + msg;
                    if (alert) alert.close();
                    showPopup(PopupType.FATAL, fullMsg);
                    logError(msg);
                }
            }
        );
    }
}

function showLogoutDialog() {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, user already logged out.');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': eblLang.logout_message,
            'modal': true,
            'movable': false,
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(eblLang.logout_message);
        if (c) callback();
    }
    
    function callback () {
        sendRequest(
            ApiType.DATA, 
            'action=log_out',
            'POST', true,
            function() { showLoadingOverlay(); },
            function(res) {
                hideLoadingOverlay();
                gState.isAdmin = false;
                gState.authToken = null;
                
                setAdminMode();
                if (!isNullOrUndef(lState.post)) {
                    var postElem = gState.container.querySelector('.ebl-post-singleview#ebl-post_' + lState.post.id);
                    if (hasClass(postElem, 'ebl-draft')) openPreviews();
                }
                else openPreviews();
            },
            function (code, msg) {
                hideLoadingOverlay();
                showPopup(PopupType.FATAL, msg);
            }
        );
    }
}

function showDeleteDialog(postId) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': eblLang.deletepost_confirm,
            'modal': true,
            'movable': false,
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(eblLang.deletepost_confirm);
        if (c) callback();
    }
    
    function callback () {
        sendRequest(
            ApiType.DATA, 
            'action=delete_post&id=' + postId + '&token=' + gState.authToken,
            'POST', true,
            function() { showLoadingOverlay(); },
            function(res) {
                hideLoadingOverlay();
                showPopup(PopupType.SUCCESS, eblLang.deletepost_ok);
                
                deleteProperty(lState.post);
                showPreviewSection();
            },
            function(code, msg) {
                hideLoadingOverlay();
                showPopup(PopupType.FATAL, 'error while deleting: ' + msg);
            }
        );
    }
}

function showReDraftDialog(onOk) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.confirm();
        alert.set({
            'title': '',
            'message': eblLang.redraft_confirm,
            'modal': true,
            'movable': false,
            'onok': onOk
        });
        alert.show();
    }
    else {
        var c = confirm(eblLang.redraft_confirm);
        if (c) onOk();
    }
}

function showTagsDialog(defaultValue, onDone) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        var inputField = alert.elements.body.querySelector('input.ajs-input');
        inputField.placeholder = eblLang.tags_placeholder;
        
        alert.set({
            'title' : eblLang.tags_title,
            'message' : eblLang.tags_message,
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'type' : 'text',
            'labels' : { ok : eblLang.general_ok },
            'value' : defaultValue,
            'onok' : function(ev, value) { onDone(value); }
        });
        alert.show();
    }
    else {
        var tags = prompt(eblLang.tags_message);
        if (tags) onDone(tags);
    }
}

function showDatetimeDialog(defaultValue, onDone) {
    if (!gState.isAdmin) {
        logError('can\'t show dialog, admin not logged');
        return;
    }
    
    if (hasAlertify()) {
        var alert = alertify.prompt();
        alert.set({
            'title' : eblLang.datetime_title,
            'message' : eblLang.datetime_message,
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'type' : 'datetime-local',
            'labels' : { ok : eblLang.general_ok },
            'value' : defaultValue,
            'onok' : function(ev, value) { onDone(value); }
        });
        alert.show();
    }
    else {
        var datetime = prompt(eblLang.datetime_message_format);
        if (datetime) onDone(datetime);
    }
}