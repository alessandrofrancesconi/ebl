// Defines the possible states of the Admin bar
var AdminBarMode = {
    CREATE_NEW: 0,      // The default status, lets the user create a new post
    EDIT_CURRENT: 1,    // Set to this when viewing a post
    SAVE_CHANGES: 2     // Set to this when editing a post
};

function buildAdminBar () {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-adminbar', 'ebl-unselectable');
    //hideElement(bar);
            
    // 'add new' container
    var newContainer = document.createElement('div');
    addClass(newContainer, 'ebl-adminbar-new');
    
    var addNew = createButton('ebl-action-new');
    addClass(addNew, 'fa', 'fa-2x', 'fa-plus-square-o');
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
    addClass(editPost, 'fa', 'fa-2x', 'fa-pencil-square-o');
    editPost.onclick = function() {
        var newState = clone(lState);
        newState.post.edit = true;
        var newParams = addUrlParam(window.location.search, 'ebl-edit', '1');
        changeHistoryState(newState, null, newParams);
        
        switchToEditorMode();
    };
    
    var deletePost = createButton('ebl-action-delete');
    addClass(deletePost, 'fa', 'fa-2x', 'fa-trash-o');
    deletePost.onclick = function () {
        showDeleteDialog(lState.post.id);
    };
    
    editContainer.appendChild(addTooltipTo(editPost, eblLang.button_editPost));
    editContainer.appendChild(addTooltipTo(deletePost, eblLang.button_deletePost));
    
    // 'save / cancel' container
    var publishContainer = document.createElement('div');
    addClass(publishContainer, 'ebl-adminbar-publish');
    
    var saveDraft = createButton('ebl-action-save');
    addClass(saveDraft, 'fa', 'fa-2x', 'fa-floppy-o');
    saveDraft.onclick = function () {
        if (lState.post.status == PostStatus.PUBLISHED) showReDraftDialog(function () { saveCurrentEditedPost(true); });
        else saveCurrentEditedPost(true);
    };
    
    var publishPost = createButton('ebl-action-publish');
    addClass(publishPost, 'fa', 'fa-2x', 'fa-cloud-upload');
    publishPost.onclick = function () {
        saveCurrentEditedPost(false);
    };
    
    var cancelEdit = createButton('ebl-action-cancel');
    addClass(cancelEdit, 'fa', 'fa-2x', 'fa-times');
    cancelEdit.onclick = function () {
        unsetEditorMode(true);
        goHistoryBack();
    };
    
    publishContainer.appendChild(addTooltipTo(saveDraft, eblLang.button_saveDraft));
    publishContainer.appendChild(addTooltipTo(publishPost, eblLang.button_publishPost));
    publishContainer.appendChild(addTooltipTo(cancelEdit, eblLang.general_cancel));
    
    // 'logout' button
    var logOut = createButton('ebl-action-logout');
    addClass(logOut, 'fa', 'fa-2x', 'fa-sign-out');
    logOut.onclick = function() {
        showLogoutDialog();
    };
    
    bar.appendChild(newContainer);
    bar.appendChild(editContainer);
    bar.appendChild(publishContainer);
    bar.appendChild(logOut);
    
    prependTo(gState.container, bar);
    
    if (isNullOrUndef(lState.post)) changeAdminBarMode(AdminBarMode.CREATE_NEW);
    else if (lState.post.status === PostStatus.NEW) changeAdminBarMode(AdminBarMode.SAVE_CHANGES);
    else changeAdminBarMode(AdminBarMode.EDIT_CURRENT);
}

function changeAdminBarMode(m) {
    var c = gState.container;
    var newContainer = c.querySelector('.ebl-adminbar-new');
    var editContainer = c.querySelector('.ebl-adminbar-edit');
    var publishContainer = c.querySelector('.ebl-adminbar-publish');
    
    if (m == AdminBarMode.CREATE_NEW) {
        showElement(newContainer);
        hideElement(editContainer);
        hideElement(publishContainer);
    }
    else if (m == AdminBarMode.EDIT_CURRENT) {
        hideElement(newContainer);
        showElement(editContainer);
        hideElement(publishContainer);
    }
    else if (m == AdminBarMode.SAVE_CHANGES) {
        hideElement(newContainer);
        hideElement(editContainer);
        showElement(publishContainer);
    }
}