
function buildAdminBar () {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-adminbar', 'ebl-unselectable');
    
    bar.origDisplay = 'block';
    bar.style.display = 'none';
            
    // 'add new' container
    var newContainer = document.createElement('div');
    addClass(newContainer, 'ebl-adminbar-new');
    
    var addNew = createButton('ebl-action-new');
    addClass(addNew, 'fa', 'ebl-icon-2x', 'ebl-icon-plus-square-o');
    addNew.onclick = function() {
        openCreateNew();
    };
    
    newContainer.appendChild(
        addTooltipTo(addNew, eblLang.button_addNew)
    );
    
    // 'edit' container
    var editContainer = document.createElement('div');
    addClass(editContainer, 'ebl-adminbar-edit');
    
    var editPost = createButton('ebl-action-edit');
    addClass(editPost, 'fa', 'ebl-icon-2x', 'ebl-icon-pencil-square-o');
    editPost.onclick = function() {
        var newState = clone(lState);
        newState.post.edit = true;
        var newParams = addUrlParam(window.location.search, 'ebl-edit', '1');
        changeHistoryState(newState, null, newParams);
        
        switchToEditorMode();
        refreshAdminBarMode();
    };
    
    var deletePost = createButton('ebl-action-delete');
    addClass(deletePost, 'fa', 'ebl-icon-2x', 'ebl-icon-trash-o');
    deletePost.onclick = function () {
        showDeleteDialog(lState.post.id);
    };
    
    editContainer.appendChild(addTooltipTo(editPost, eblLang.button_editPost));
    editContainer.appendChild(addTooltipTo(deletePost, eblLang.button_deletePost));
    
    // 'save / cancel' container
    var publishContainer = document.createElement('div');
    addClass(publishContainer, 'ebl-adminbar-publish');
    
    var saveDraft = createButton('ebl-action-save');
    addClass(saveDraft, 'fa', 'ebl-icon-2x', 'ebl-icon-floppy-o');
    saveDraft.onclick = function () {
        if (lState.post.status == PostStatus.PUBLISHED) showReDraftDialog(function () { saveCurrentEditedPost(true); });
        else saveCurrentEditedPost(true);
    };
    
    var publishPost = createButton('ebl-action-publish');
    addClass(publishPost, 'fa', 'ebl-icon-2x', 'ebl-icon-cloud-upload');
    publishPost.onclick = function () {
        saveCurrentEditedPost(false);
    };
    
    var cancelEdit = createButton('ebl-action-cancel');
    addClass(cancelEdit, 'fa', 'ebl-icon-2x', 'ebl-icon-close');
    cancelEdit.onclick = function () {
        unsetEditorMode(true);
        goHistoryBack();
    };
    
    publishContainer.appendChild(addTooltipTo(saveDraft, eblLang.button_saveDraft));
    publishContainer.appendChild(addTooltipTo(publishPost, eblLang.button_publishPost));
    publishContainer.appendChild(addTooltipTo(cancelEdit, eblLang.general_cancel));
    
    // 'logout' button
    var logOut = createButton('ebl-action-logout');
    addClass(logOut, 'fa', 'ebl-icon-2x', 'ebl-icon-sign-out');
    logOut.onclick = function() {
        showLogoutDialog();
    };
    
    bar.appendChild(newContainer);
    bar.appendChild(editContainer);
    bar.appendChild(publishContainer);
    bar.appendChild(logOut);
    
    prependTo(gState.container, bar);
    refreshAdminBarMode();
}

function refreshAdminBarMode() {
    var c = gState.container;
    var newContainer = c.querySelector('.ebl-adminbar-new');
    var publishContainer = c.querySelector('.ebl-adminbar-publish');
    var editContainer = c.querySelector('.ebl-adminbar-edit');
    
    if (isNullOrUndef(lState.post)) { // "CREATE NEW" mode
        showElement(newContainer);
        hideElement(publishContainer);
        hideElement(editContainer);
    }
    else if (lState.post.edit === true) { // "EDITING" mode
        hideElement(newContainer);
        showElement(publishContainer);
        hideElement(editContainer);
    }
    else { // "SINGLE POST" mode
        hideElement(newContainer);
        hideElement(publishContainer);
        showElement(editContainer);
    }
}