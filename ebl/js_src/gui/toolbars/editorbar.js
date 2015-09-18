function buildEditorToolbar() {
    var bar = document.createElement('div');
    addClass(bar, 'ebl-toolbar', 'ebl-editor-toolbar');
    
    var separator = document.createElement('span');
    addClass(separator, 'ebl-separator');
    
    var format = document.createElement('div');
    
    var undo = createButton('ebl-action-editor-undo', eblLang.editor_toolbar_undo);
    addClass(undo, 'fa', 'fa-undo');
    setDataAttribute(undo, 'wysihtml5Command', 'undo');
    
    var textBold = createButton('ebl-action-editor-bold', eblLang.editor_toolbar_textBold);
    addClass(textBold, 'fa', 'fa-bold');
    setDataAttribute(textBold, 'wysihtml5Command', 'bold');
    
    var textItalic = createButton('ebl-action-editor-italic', eblLang.editor_toolbar_textItalic);
    addClass(textItalic, 'fa', 'fa-italic');
    setDataAttribute(textItalic, 'wysihtml5Command', 'italic');
    
    var textUnderline = createButton('ebl-action-editor-underline', eblLang.editor_toolbar_textUnderline);
    addClass(textUnderline, 'fa', 'fa-underline');
    setDataAttribute(textUnderline, 'wysihtml5Command', 'underline');
    
    var textH1 = createButton('ebl-action-editor-h1', eblLang.editor_toolbar_textH1);
    addClass(textH1, 'fa', 'fa-header');
    setDataAttribute(textH1, 'wysihtml5Command', 'formatBlock');
    setDataAttribute(textH1, 'wysihtml5CommandValue', 'h1');
    
    var alignLeft = createButton('ebl-action-editor-alignleft', eblLang.editor_toolbar_textAlignLeft);
    addClass(alignLeft, 'fa', 'fa-align-left');
    setDataAttribute(alignLeft, 'wysihtml5Command', 'justifyLeft');
    
    var alignCenter = createButton('ebl-action-editor-aligncenter', eblLang.editor_toolbar_textAlignCenter);
    addClass(alignCenter, 'fa', 'fa-align-center');
    setDataAttribute(alignCenter, 'wysihtml5Command', 'justifyCenter');
    
    var alignRight = createButton('ebl-action-editor-alignright', eblLang.editor_toolbar_textAlignRight);
    addClass(alignRight, 'fa', 'fa-align-right');
    setDataAttribute(alignRight, 'wysihtml5Command', 'justifyRight');
    
    var addUl = createButton('ebl-action-editor-addul', eblLang.editor_toolbar_addUl);
    addClass(addUl, 'fa', 'fa-list-ul');
    setDataAttribute(addUl, 'wysihtml5Command', 'insertUnorderedList');
    
    var addOl = createButton('ebl-action-editor-addol', eblLang.editor_toolbar_addOl);
    addClass(addOl, 'fa', 'fa-list-ol');
    setDataAttribute(addOl, 'wysihtml5Command', 'insertOrderedList');
    
    var addImage = createButton('ebl-action-editor-addimage', eblLang.editor_toolbar_addImage);
    addClass(addImage, 'fa', 'fa-picture-o');
    setDataAttribute(addImage, 'wysihtml5Command', 'insertImage');
    
    var addLink = createButton('ebl-action-editor-addlink', eblLang.editor_toolbar_addLink);
    addClass(addLink, 'fa', 'fa-link');
    setDataAttribute(addLink, 'wysihtml5Command', 'createLink');
    
    var showHtml = createButton('ebl-action-editor-html', eblLang.editor_toolbar_editHTML);
    addClass(showHtml, 'fa', 'fa-file-code-o');
    setDataAttribute(showHtml, 'wysihtml5Action', 'change_view');
    
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
    setDataAttribute(image, 'wysihtml5Dialog', 'insertImage');
    addClass(image, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var imageSrc = document.createElement('input');
    setDataAttribute(imageSrc, 'wysihtml5DialogField', 'src');
    imageSrc.type = 'text';
    imageSrc.value = 'http://';
    
    var imageSrcSave = createButton('ebl-action-editor-image-save', eblLang.editor_toolbar_addImage);
    imageSrcSave.innerHTML = eblLang.editor_toolbar_addImage;
    setDataAttribute(imageSrcSave, 'wysihtml5DialogAction', 'save');
    
    image.appendChild(imageSrc);
    image.appendChild(imageSrcSave);
    hideElement(image);
    
    var link = document.createElement('div');
    setDataAttribute(link, 'wysihtml5Dialog', 'createLink');
    addClass(link, 'ebl-editor-toolbar-sub', 'toolbar-sub-2');
    
    var linkUrl = document.createElement('input');
    setDataAttribute(linkUrl, 'wysihtml5DialogField', 'href');
    linkUrl.type = 'text';
    linkUrl.value = 'http://';
    
    var linkUrlSave = createButton('ebl-action-editor-link-save', eblLang.editor_toolbar_addLink);
    linkUrlSave.innerHTML = eblLang.editor_toolbar_addLink;
    setDataAttribute(linkUrlSave, 'wysihtml5DialogAction', 'save');
    
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
    
    var tags = createButton('ebl-action-title-tag', eblLang.title_toolbar_tags);
    addClass(tags, 'fa', 'fa-tags');
    tags.onmousedown = function() {
        showTagsDialog(parseTagsFromArray(lState.post.tags), function (newTags) {
            lState.post.tags = parseTagsFromString(newTags);
        });
    };
    
    bar.appendChild(tags);
    
    bar.style.visibility = 'hidden';
    prependTo(gState.container, bar);
    
    return bar;
}