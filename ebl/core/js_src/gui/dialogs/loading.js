function showLoadingOverlay() {
    var c = gState.container;
    var overlay = c.querySelector('.ebl-loading-overlay');
    if (isNullOrUndef(overlay)) {
        overlay = document.createElement('div');
        addClass(overlay, 'ebl-loading-overlay', 'ebl-unselectable');
        var spinner = document.createElement('div');
        addClass(spinner, 'ebl-icon-gear', 'ebl-icon-spin', 'ebl-icon-4x');
        
        overlay.appendChild(spinner);
        prependTo(c, overlay);
    }
    
    c.style.position = 'relative';
    addClass(overlay, 'visible');
}

function hideLoadingOverlay() {
    var c = gState.container;
    var overlay = c.querySelector('.ebl-loading-overlay');
    c.style.position = 'static';
    removeClass(overlay, 'visible');
}