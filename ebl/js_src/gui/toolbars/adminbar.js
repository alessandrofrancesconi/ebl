
function buildAdminBar () {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-adminbar', 'ebl-unselectable');
    
    bar.origDisplay = 'block';
    bar.style.display = 'none';
            
    // 'add new' container
    var newContainer = document.createElement('div');
    addClass(newContainer, 'ebl-adminbar-new');
    
    var addNew = createButton('ebl-action-new');
    addClass(addNew, 'ebl-icon-2x', 'ebl-icon-plus-square');
    addNew.onclick = function() {
        openCreateNew();
    };
    
    newContainer.appendChild(
        addTooltipTo(addNew, l18n_("Write something new"))
    );
    
    // 'edit' container
    var editContainer = document.createElement('div');
    addClass(editContainer, 'ebl-adminbar-edit');
    
    var editPost = createButton('ebl-action-edit');
    addClass(editPost, 'ebl-icon-2x', 'ebl-icon-pencil-square');
    editPost.onclick = function() {
        var newState = clone(lState);
        newState.post.edit = true;
        var newParams = addUrlParam(window.location.search, 'ebl-edit', '1');
        changeHistoryState(newState, null, newParams);
        
        switchToEditorMode();
        refreshAdminBarMode();
    };
    
    var deletePost = createButton('ebl-action-delete');
    addClass(deletePost, 'ebl-icon-2x', 'ebl-icon-trash');
    deletePost.onclick = function () {
        showDeleteDialog(lState.post.id);
    };
    
    editContainer.appendChild(addTooltipTo(editPost, l18n_("Edit this post")));
    editContainer.appendChild(addTooltipTo(deletePost, l18n_("Delete this post")));
    
    // 'save / cancel' container
    var publishContainer = document.createElement('div');
    addClass(publishContainer, 'ebl-adminbar-publish');
    
    var saveDraft = createButton('ebl-action-save');
    addClass(saveDraft, 'ebl-icon-2x', 'ebl-icon-floppy');
    saveDraft.onclick = function () {
        if (lState.post.status == PostStatus.PUBLISHED) showReDraftDialog(function () { saveCurrentEditedPost(true); });
        else saveCurrentEditedPost(true);
    };
    
    var publishPost = createButton('ebl-action-publish');
    addClass(publishPost, 'ebl-icon-2x', 'ebl-icon-upload');
    publishPost.onclick = function () {
        saveCurrentEditedPost(false);
    };
    
    var cancelEdit = createButton('ebl-action-cancel');
    addClass(cancelEdit, 'ebl-icon-2x', 'ebl-icon-close');
    cancelEdit.onclick = function () {
        unsetEditorMode(true);
        goHistoryBack();
    };
    
    publishContainer.appendChild(addTooltipTo(saveDraft, l18n_("Save as draft")));
    publishContainer.appendChild(addTooltipTo(publishPost, l18n_("Publish now")));
    publishContainer.appendChild(addTooltipTo(cancelEdit, l18n_("Cancel")));
    
    // 'logout' button
    var logOut = createButton('ebl-action-logout');
    addClass(logOut, 'ebl-icon-2x', 'ebl-icon-sign-out');
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