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
            'title' : l18n_("Welcome to Ebl!"),
            'message' : l18n_("Everything is ready to put some contents on your blog. But first, you need a passphrase! Create it here:"),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : l18n_("Ok") },
            'type' : 'password',
            'value' : '',
            'onok' : function(ev, value) { callback (value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(l18n_("Everything is ready to put some contents on your blog. But first, you need a passphrase! Create it here:"), '');
        if (psw) callback(psw);
    }
    
    function callback(value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, l18n_("Choose a longer passphrase, it's worth it!"));
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
                
                showPopup(PopupType.SUCCESS, l18n_("Admin created, bring it on!"));
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
            'title' : l18n_("Restricted area"),
            'message' : l18n_("Are you the master? Type the passphrase:"),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'type' : 'password',
            'value' : '',
            'onok' : function (ev, value) { callback(value, ev, this); }
        });
        alert.show();
    }
    else {
        var psw = prompt(l18n_("Are you the master? Type the passphrase:"), '');
        if (psw) callback(psw);
    }
    
    function callback (value, ev, alert) {
        if (ev) ev.cancel = true;
        
        if (value.length < 5) {
            if (value.length > 0) showPopup(PopupType.ERROR, l18n_("Wrong passphrase :("));
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
                
                showPopup(PopupType.SUCCESS, l18n_("You have been logged in!"));
                if (alert) alert.close();
                
                setAdminMode();
                if (isNullOrUndef(lState.post)) openPreviews();
            },
            function (code, msg) {
                if (code === ApiResult.EBL_ERROR_AUTH_SHORTACCESS) { }
                else if (code === ApiResult.EBL_ERROR_AUTH_NOTLOGGED) {
                    showPopup(PopupType.ERROR, l18n_("Wrong passphrase :("));
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
            'message': l18n_("Really log out?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("Really log out?"));
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
            'message': l18n_("Do you really want to delete this post?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': callback
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("Do you really want to delete this post?"));
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
                showPopup(PopupType.SUCCESS, l18n_("Post deleted"));
                
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
            'message': l18n_("This will take this post back to a draft status, are you sure?"),
            'modal': true,
            'movable': false,
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'onok': onOk
        });
        alert.show();
    }
    else {
        var c = confirm(l18n_("This will take this post back to a draft status, are you sure?"));
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
        inputField.placeholder = l18n_("e.g.: biscuits, coffee lovers, the-number-42");
        
        alert.set({
            'title' : l18n_("Tags"),
            'message' : l18n_("Write down a list of tags for this post, separated by comma. Only letters and numbers are allowed and spaces will be replaced with the \"-\" character."),
            'closable' : false,
            'movable' : false,
            'resizable' : false,
            'maximizable' : false,
            'type' : 'text',
            'labels' : { ok : l18n_("Ok"), cancel : l18n_("Cancel") },
            'value' : defaultValue,
            'onok' : function(ev, value) { onDone(value); }
        });
        alert.show();
    }
    else {
        var tags = prompt(l18n_("Write down a list of tags for this post, separated by comma. Only letters and numbers are allowed and spaces will be replaced with the \"-\" character."));
        if (tags) onDone(tags);
    }
}
