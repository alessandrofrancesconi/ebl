function buildEditorToolbar() {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-toolbar', 'ebl-editor-toolbar');
    
    var separator = document.createElement('span');
    addClass(separator, 'ebl-separator');
    
    var format = document.createElement('div');
    
    var undo = createButton('ebl-action-editor-undo', l18n_("Undo"));
    addClass(undo, 'ebl-icon-rotate-left');
    setDataAttribute(undo, 'wysihtmlCommand', 'undo');
    
    var textBold = createButton('ebl-action-editor-bold', l18n_("Bold"));
    addClass(textBold, 'ebl-icon-bold');
    setDataAttribute(textBold, 'wysihtmlCommand', 'bold');
    
    var textItalic = createButton('ebl-action-editor-italic', l18n_("Italic"));
    addClass(textItalic, 'ebl-icon-italic');
    setDataAttribute(textItalic, 'wysihtmlCommand', 'italic');
    
    var textUnderline = createButton('ebl-action-editor-underline', l18n_("Underline"));
    addClass(textUnderline, 'ebl-icon-underline');
    setDataAttribute(textUnderline, 'wysihtmlCommand', 'underline');
    
    var textH1 = createButton('ebl-action-editor-h1', l18n_("H1"));
    addClass(textH1, 'ebl-icon-header');
    setDataAttribute(textH1, 'wysihtmlCommand', 'formatBlock');
    setDataAttribute(textH1, 'wysihtmlCommandValue', 'h1');
    
    var alignLeft = createButton('ebl-action-editor-alignleft', l18n_("Align left"));
    addClass(alignLeft, 'ebl-icon-align-left');
    setDataAttribute(alignLeft, 'wysihtmlCommand', 'justifyLeft');
    
    var alignCenter = createButton('ebl-action-editor-aligncenter', l18n_("Align center"));
    addClass(alignCenter, 'ebl-icon-align-center');
    setDataAttribute(alignCenter, 'wysihtmlCommand', 'justifyCenter');
    
    var alignRight = createButton('ebl-action-editor-alignright', l18n_("Align right"));
    addClass(alignRight, 'ebl-icon-align-right');
    setDataAttribute(alignRight, 'wysihtmlCommand', 'justifyRight');
    
    var addUl = createButton('ebl-action-editor-addul', l18n_("Unordered list"));
    addClass(addUl, 'ebl-icon-list-ul');
    setDataAttribute(addUl, 'wysihtmlCommand', 'insertUnorderedList');
    
    var addOl = createButton('ebl-action-editor-addol', l18n_("Ordered list"));
    addClass(addOl, 'ebl-icon-list-ol');
    setDataAttribute(addOl, 'wysihtmlCommand', 'insertOrderedList');
    
    var addImage = createButton('ebl-action-editor-addimage', l18n_("Add image"));
    addClass(addImage, 'ebl-icon-image');
    setDataAttribute(addImage, 'wysihtmlCommand', 'insertImage');
    
    var addLink = createButton('ebl-action-editor-addlink', l18n_("Add link"));
    addClass(addLink, 'ebl-icon-chain');
    setDataAttribute(addLink, 'wysihtmlCommand', 'createLink');
    
    var showHtml = createButton('ebl-action-editor-html', l18n_("Edit HTML"));
    addClass(showHtml, 'ebl-icon-file-code');
    setDataAttribute(showHtml, 'wysihtmlAction', 'change_view');
    
    format.appendChild(undo);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(textBold);
    format.appendChild(textItalic);
    format.appendChild(textUnderline);
    format.appendChild(textH1);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(alignLeft);
    format.appendChild(alignCenter);
    format.appendChild(alignRight);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(addUl);
    format.appendChild(addOl);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(addImage);
    format.appendChild(addLink);
    format.appendChild(separator.cloneNode(true));
    
    format.appendChild(showHtml);
    
    var image = document.createElement('div');
    setDataAttribute(image, 'wysihtmlDialog', 'insertImage');
    addClass(image, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var imageSrc = document.createElement('input');
    setDataAttribute(imageSrc, 'wysihtmlDialogField', 'src');
    imageSrc.type = 'text';
    imageSrc.value = 'http://';
    
    var imageSrcSave = createButton('ebl-action-editor-image-save', l18n_("Add image"));
    imageSrcSave.innerHTML = l18n_("Add image");
    setDataAttribute(imageSrcSave, 'wysihtmlDialogAction', 'save');
    
    image.appendChild(imageSrc);
    image.appendChild(imageSrcSave);
    hideElement(image);
    
    var link = document.createElement('div');
    setDataAttribute(link, 'wysihtmlDialog', 'createLink');
    addClass(link, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var linkUrl = document.createElement('input');
    setDataAttribute(linkUrl, 'wysihtmlDialogField', 'href');
    linkUrl.type = 'text';
    linkUrl.value = 'http://';
    
    var linkUrlSave = createButton('ebl-action-editor-link-save', l18n_("Add link"));
    linkUrlSave.innerHTML = l18n_("Add link");
    setDataAttribute(linkUrlSave, 'wysihtmlDialogAction', 'save');
    
    link.appendChild(linkUrl);
    link.appendChild(linkUrlSave);
    hideElement(link);
    
    bar.appendChild(format);
    bar.appendChild(image);
    bar.appendChild(link);
    
    bar.style.visibility = 'hidden';
    prependTo(gState.container, bar);
    
    return bar;
}

function buildTitleToolbar() {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-toolbar', 'ebl-title-toolbar');
    
    var tags = createButton('ebl-action-title-tag',  l18n_("Tags"));
    addClass(tags, 'ebl-icon-tags');
    tags.onmousedown = function() {
        showTagsDialog(printTagsFromArray(lState.post.tags), function (newTags) {
            lState.post.tags = parseTagsFromString(newTags);
        });
    };
    
    bar.appendChild(tags);
    
    bar.style.visibility = 'hidden';
    prependTo(gState.container, bar);
    
    return bar;
}