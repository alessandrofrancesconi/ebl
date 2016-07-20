<?php

/**
 * This file is part of
 * Ebl: the embeddable blog
 *
 * Licensed under the MIT license
 */
 
require ("EblApi.php");
require ("../libs/Smarty/Smarty/Smarty.class.php");

class RenderApi extends EblApi {
    
    const TEMPLATES_DIR = DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR ."..". DIRECTORY_SEPARATOR ."templates". DIRECTORY_SEPARATOR;
    const TEMPLATES_CACHE_FOLDER = self::TEMPLATES_DIR ."_cache";
    
    private $smarty = null;
    
    function __construct() {
        parent::__construct();
        
        set_error_handler(array($this, 'fatalErrorHandler'));
        
        $this->smarty = new Smarty();
        $this->smarty->muteExpectedErrors();
        $this->smarty->setCompileDir($this->workingPath . self::TEMPLATES_CACHE_FOLDER);
        
        $eblVar = new stdClass();
        $eblVar->class = new stdClass();
        $eblVar->class->postTitle = "ebl-post-title";
        $eblVar->class->postBody = "ebl-post-body";
        $eblVar->class->postLink = "ebl-post-link";
        $eblVar->class->postComments = "ebl-post-comments";
        $eblVar->class->nav = "ebl-nav";
        $eblVar->class->navLink = "ebl-nav-link";
        
        $eblVar->case = new stdClass();
        $eblVar->case->hasNextPosts = false;
        $eblVar->case->hasPrevPosts = false;
        
        $eblVar->links = new stdClass();
        $eblVar->links->nextPage = "#";
        $eblVar->links->prevPage = "#";
        
        $eblVar->utils = new stdClass();
        $eblVar->utils->versionString = self::EBL_VERSION_STRING;
        $eblVar->utils->versionCode = self::EBL_VERSION_CODE;
        
        $this->smarty->assign('ebl', $eblVar);
    }
    
    public function processAction($args) {
        $config = array();
        if (isset($_GET['template'])) $config['template'] = $_GET['template'];
        if (isset($_GET['posts_per_page'])) $config['postsPerPage'] = $_GET['posts_per_page'];
        
        try {
        switch($args['action']) {
            
            case "get_html":
                $post = (isset($args['ebl-post']) ? $args['ebl-post'] : null);
                $isNew = (isset($args['ebl-new']) ? filter_var($args['ebl-new'], FILTER_VALIDATE_BOOLEAN) : false);
                $pageNumber = (isset($args['ebl-page']) ? $args['ebl-page'] : 0);
                
                $renderRes = $this->getHtml($post, $isNew, $pageNumber, $config);
                break;
                
            case "get_post":
                $postId = (isset($args['id']) ? $args['id'] : null);
                $renderRes = $this->getPost($postId, $config);
                break;
                
            case "get_page":
                $pageNumber = (isset($args['number']) ? $args['number'] : 0);
                $renderRes = $this->getPostsPage($pageNumber, $config);
                break;
                
            default: 
                throw Exception("unknown action ". $args['action']);
                break;
        }
        } catch (Exception $e) {
            http_response_code($e->getCode());
            $renderRes = "<div class=\"ebl-error\">There is a problem with Ebl! Here are some information: <pre class=\"ebl-pre\">". 
                "Message: '". $e->getMessage() ."'<br />In file: '". $e->getFile() ."' | Line ". $e->getLine() ."</pre></div>";
        }
        
        echo $renderRes;
    }
    
    private function getHtml($post = null, $isNew = false, $page = 0, $config) {
        $this->initDb();
        
        $html = "";
        try {
            if ($post != null) $html .= $this->getPost($post, $config);
            else if ($isNew) $html .= $this->getNewPostHtml($config);
            else $html .= $this->getPostsPage($page, $config);
        }
        catch (Exception $e) {
            if ($e instanceof DatabaseException && $e->getCode() == self::EBL_ERROR_NOTFOUND && $post != null) {
                return $this->getHtml(null, false, $page, $config);
            }
            else throw $e;
        }
        
        return "<div class=\"ebl-container\">\n". $html ."</div>";
    }
    
    private function getPostsPage($page = 0, $config) {
        $this->initDb();
        $configVal = $this->getConfigValues($config, array(
            new EblConfigValue('postsPerPage', FILTER_VALIDATE_INT, true),
            new EblConfigValue('template', null, true)));
            
        $count = $configVal['postsPerPage'];
        
        $query = $this->repo->query()
            ->where('type', '===', "post")
            ->orderBy('createdAt DESC')
            ->limit($count, $page * $count);
        
        $logged = $this->getLoggedState();
        if (!$logged) $query = $query->where('status', '===', "published");
        
        $docs = $query->execute();
        $posts = new stdClass();
        $posts->list = array();
        
        $baseUrl = isset($_SERVER['HTTP_REFERER']) ? 
            substr($_SERVER['HTTP_REFERER'], 0, strpos($_SERVER['HTTP_REFERER'], '?')) : "";
        
        foreach ($docs as $doc) {
            $post = $this->createPostFromDoc($doc);
            
            $post->className = "ebl-post";
            if ($post->status == "draft") $post->className .= " ebl-draft";
                
            $post->permaLink = $baseUrl."?ebl-post=".$doc->getId();            
            $posts->list[] = $post;
        }
        $posts->total = $docs->total();
        
        $eblVars = $this->smarty->getTemplateVars('ebl');
        $from = $page * $count;
        if ($from > 0) {
            $eblVars->case->hasNextPosts = true;
            $eblVars->links->nextPage = $baseUrl."?ebl-page=". ($page - 1);
        }
        else {
            $eblVars->case->hasNextPosts = false;
            $eblVars->links->nextPage = "#";
        }
        
        if ($from + count($posts->list) < $posts->total) {
            $eblVars->case->hasPrevPosts = true;
            $eblVars->links->prevPage = $baseUrl."?ebl-page=". ($page + 1);
        }
        else {
            $eblVars->case->hasPrevPosts = false;
            $eblVars->links->prevPage = "#";
        }
        
        $eblVars->previews = $posts->list;
        $eblVars->class->post = "ebl-post ebl-post-preview";
        
        $this->smarty->assign('ebl', $eblVars); 
        $html = $this->smarty->fetch($this->workingPath . self::TEMPLATES_DIR . $configVal['template']. "/previews.tpl");
        
        return "<ebl-template data-ebl-type=\"page\" data-ebl-page-num=\"". $page ."\">". $html ."</ebl-template>";
    }
    
    private function getNewPostHtml($config = array()) {
        $this->initDb();
        
        $post = $this->createPostFromDoc(null);
        $configVal = $this->getConfigValues($config, array(
            new EblConfigValue('template', null, true)
        ));
        
        $eblVars = $this->smarty->getTemplateVars('ebl');
        
        $post->className = "ebl-post ebl-post-singleview ebl-post-new";
        $eblVars->singlePost = $post;
        
        $this->smarty->assign('ebl', $eblVars); 
        $html = $this->smarty->fetch($this->workingPath . self::TEMPLATES_DIR . $configVal['template']. "/single.tpl");
        
        return "<ebl-template data-ebl-type=\"post\" data-ebl-post-status=\"new\">". $html ."</ebl-template>";
    }
    
    private function getPost($postId, $config = array()) {
        $this->initDb();
        
        $query = $this->repo->query()
            ->where('__id', '===', $postId);
        
        $logged = $this->getLoggedState();
        if (!$logged) $query = $query->where('status', '===', "published");
        
        $docs = $query->execute();
        if (count($docs) == 0) {
            throw new DatabaseException("can't find post with ID '". $postId ."'", self::EBL_ERROR_NOTFOUND);
        }
        
        $doc = $docs[0];
        $post = $this->createPostFromDoc($doc);
        
        $configVal = $this->getConfigValues($config, array(
            new EblConfigValue('template', null, true)
        ));
        
        $eblVars = $this->smarty->getTemplateVars('ebl');
        
        $post->className = "ebl-post ebl-post-singleview";
        if ($post->status == "draft") $post->className .= " ebl-draft";
        $eblVars->singlePost = $post;
        
        $postTags = ""; $i = 0;
        foreach ($post->tags as $tag) {
            $postTags .= $tag->id;
            if ($i < count($post->tags) - 1) $postTags .= ",";
            $i++;
        }
        
        $this->smarty->assign('ebl', $eblVars); 
        $html = $this->smarty->fetch($this->workingPath . self::TEMPLATES_DIR . $configVal['template']. "/single.tpl");
        
        return "<ebl-template data-ebl-type=\"post\" 
            data-ebl-post-status=\"". $post->status ."\" 
            data-ebl-post-id=\"". $postId ."\" 
            data-ebl-post-title=\"". $post->title ."\" 
            data-ebl-post-createdat=\"". $post->createdAt ."\" 
            data-ebl-post-updatedat=\"". $post->updatedAt ."\" 
            data-ebl-post-tags=\"". $postTags ."\">". $html ."</ebl-template>";
    }
    
    public function fatalErrorHandler($severity, $message, $filename, $lineno) {
        throw new ErrorException($message, self::EBL_ERROR_INTERNAL, $severity, $filename, $lineno);
    }
}

header('Content-Type: text/html; charset=utf-8');
if (($getRequest = isset($_GET['action'])) || ($postRequest = isset($_POST['action']))) {
    $api = new RenderApi();
    $api->processAction($getRequest ? $_GET : $_POST);
}
?>