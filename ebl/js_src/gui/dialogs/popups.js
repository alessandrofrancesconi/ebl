var PopupType = {
    FATAL: 0,
    ERROR: 1,
    SUCCESS: 2
};

function showPopup(type, text) {
    if (type == PopupType.SUCCESS) {
        if (hasAlertify()) alertify.success(text); else alert(text);
    }
    else if (type == PopupType.ERROR) {
        if (hasAlertify()) alertify.error(text); else alert(text);
    }
    else if (type == PopupType.FATAL) {
        if (hasAlertify()) alertify.alert('', '<p class="ebl-error">' + eblLang.general_fatalError + '</p><pre class="ebl-pre">' + text + '</pre>'); 
        else alert(text);
    }
}
