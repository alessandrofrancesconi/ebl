// These two object contain information about the state of Ebl

var GlobalState = Base.extend({
    constructor: function() {
        this.isAdmin = false;
        this.authToken = null;
        this.docTitle = null;
        this.container = null;
        
        // default config
        this.config = {
            template: 'default',
            language: 'en',
            postsPerPage: 5,
            pageTitleFormat: "{ebl_title} | {doc_title}",
            
            // callbacks
            onBlogLoaded: null,
            onPostOpened: null,
            onPageChanged: null
        };
    }
});

var LocalState = Base.extend({
    constructor: function() {
        this.page = 0;
        this.post = null;
        this.editors = null;
    }
});

var PostStatus = {
    NEW: 0,
    DRAFT: 1,
    PUBLISHED: 2,
    
    parse: function (s) {
        if (s.toLowerCase() == "new") return 0;
        if (s.toLowerCase() == "draft") return 1;
        if (s.toLowerCase() == "published") return 2;
        return null;
    }
};

var gState = new GlobalState();    // state shared among the entire session
var lState = new LocalState();     // state of the current view
