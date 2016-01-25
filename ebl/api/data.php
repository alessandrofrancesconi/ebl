<?php

require ("EblApi.php");

require ("../libs/json-api/src/Util.php");
require ("../libs/json-api/src/LinksTrait.php");
require ("../libs/json-api/src/MetaTrait.php");

require ("../libs/json-api/src/ElementInterface.php");
require ("../libs/json-api/src/Resource.php");
require ("../libs/json-api/src/Collection.php");

require ("../libs/json-api/src/Document.php");
require ("../libs/json-api/src/Relationship.php");
require ("../libs/json-api/src/Parameters.php");
require ("../libs/json-api/src/SerializerInterface.php");
require ("../libs/json-api/src/AbstractSerializer.php");

require ("serializers/ResultSerializer.php");
require ("serializers/SessionSerializer.php");
require ("serializers/PostSerializer.php");

use Tobscure\JsonApi\Document;
use Tobscure\JsonApi\Collection;
use Tobscure\JsonApi\Resource;
use Tobscure\JsonApi\Parameters;

class DataApi extends EblApi {
    
    const ADMIN_DATA_PREFIX = "_adminData-";
    
    function __construct() {
        parent::__construct();
    }

    public function processAction($args) {
        $document = new Document();
        $element = NULL;
        $meta = array();
        
        try {
        switch($args['action']) {
            
            case "init_repository":
                $this->initRepository($args['psw']);
                $session = $this->getSession();
                $element = (new Resource($session, new SessionSerializer));
                break;
                
            case "log_in":
                $this->logIn($args['psw']);
                $session = $this->getSession();
                $element = (new Resource($session, new SessionSerializer));
                break;
                         
            case "log_out":
                $this->logOut();
                $session = $this->getSession();
                $element = (new Resource($session, new SessionSerializer));
                break;
                
            case "get_session":
                $session = $this->getSession();
                $element = (new Resource($session, new SessionSerializer));
                break;
                
            case "get_post":
                $postId = (isset($args['id']) ? $args['id'] : NULL);
                
                $post = $this->getPost($postId);
                $element = (new Resource($post, new PostSerializer))->fields(['tags']);
                break;
                
            case "get_posts":               
                $parameters = new Parameters($args);     
                $sort = $parameters->getSort();
                if ($sort == NULL) $sort = array();
                
                $limit = $parameters->getLimit();
                if ($limit == NULL) $limit = -1;
                
                $offset = $parameters->getOffset();
                if ($offset == NULL) $offset = 0;
                
                $posts = $this->getPosts($sort, $limit, $offset);
                $element = (new Collection($posts, new PostSerializer))->fields(['tags']);
                break;
            
            case "publish_post":
                $id = $this->publishPost($args['title'], $args['body'], $args['tags'], $args['draft'], $args['token']);
                
                $element = (new Resource(new stdClass(), new ResultSerializer));
                $document->addMeta("id", $id);
                break;
            
            case "update_post":
                $id = $this->updatePost($args['id'], $args['title'], $args['body'], $args['tags'], $args['draft'], $args['token']);
                
                $element = (new Resource(new stdClass(), new ResultSerializer));
                $document->addMeta("id", $id);
                break;
                
            case "delete_post":
                $this->deletePost($args['id'], $args['token']);
                
                $element = (new Resource(new stdClass(), new ResultSerializer));
                break;
                
            default: 
                throw new Exception("unknown action ". $args['action'], self::EBL_ERROR_BADREQUEST);
                break;
        }
        
        } catch (Exception $e) {
            http_response_code($e->getCode());
            $document->setErrors(array(array(
                "message" => $e->getMessage()
            )));
        }
        
        if ($element != NULL)$document->setData($element);
        echo json_encode($document->toArray());
    }
    
    private function initRepository($password) {
        $this->initDb();
        $this->verifyAdminData(0);
        
        $salt = generateRandomString(35);
        $salt_full = "$2a$10$".$salt;
        $hashed_password = crypt($password, $salt_full);
        
        $now = date(self::DATE_FORMAT_ISO8601, time());
        $admin = new \JamesMoss\Flywheel\Document(array(
            'type' => "adminData",
            'password' => $hashed_password,
            'createdAt' => $now,
            'lastAccess' => $now,
        ));
        
        $admin->setId(self::ADMIN_DATA_PREFIX.$salt);
        $this->repo->store($admin);
        
        $_SESSION['ebl_logged'] = true;
        $_SESSION['ebl_token'] = generateRandomString(20);
    }
    
    private function logIn($typed_password) {
        $this->initDb();
        $adminData = $this->verifyAdminData(1);
        
        // try to prevent brute-force login (with simplicity)
        $now = time();
        $lastAccess = strtotime($adminData->lastAccess);
        if ($now - $lastAccess < 3) {
            throw new SessionException("too many attempts in a short time. retry.", self::EBL_ERROR_AUTH_SHORTACCESS);
        }
        
        $adminData->lastAccess = date(self::DATE_FORMAT_ISO8601, $now);
        $this->repo->update($adminData);
        
        $salt = substr($adminData->getId(), strlen(self::ADMIN_DATA_PREFIX));
        $bcrypt_salt = "$2a$10$".$salt;
        $hashed_pass = crypt($typed_password, $bcrypt_salt);
        $valid = false;
        if (function_exists('hash_equals')) $valid = hash_equals($hashed_pass, $adminData->password);
        else $valid = (strcmp($hashed_pass, $adminData->password) == 0);
        
        if ($valid) {
            $_SESSION['ebl_logged'] = true;
            $_SESSION['ebl_token'] = generateRandomString(20);
        }
        else {
            $this->logOut();
            throw new SessionException("invalid login", self::EBL_ERROR_AUTH_NOTLOGGED);
        }
    }
    
    private function logOut() {
        unset($_SESSION['ebl_logged']);
        unset($_SESSION['ebl_token']);
    }
    
    private function getSession() {
        $this->initDb();
        $this->verifyAdminData(1);
        
        $session = new stdClass();
        $session->logged = $this->getLoggedState();
        $session->token = ($session->logged === true ? $_SESSION['ebl_token'] : NULL);
        
        return $session;
    }
    
    private function getPost($postId) {
        $this->initDb();
        
        $query = $this->repo->query()
            ->where('_id', '===', $postId);
        
        $logged = $this->getLoggedState();
        if (!$logged) $query = $query->where('status', '===', "published");
        
        $docs = $query->execute();
        if (count($docs) == 0) {
            throw new DatabaseException("can't find post with ID '". $postId ."'", self::EBL_ERROR_NOTFOUND);
        }
        
        return $this->createPostFromDoc($docs[0]);
    }
    
    private function getPosts($sort = array("createdAt" => "desc"), $limit = -1, $offset = 0) {
        $this->initDb();
        
        $sortStr = ""; $i = 0;
        foreach($sort as $k => $s) {
            $sortStr .= $k ." ". $s;
            if ($i < count($sort) - 1) $sortStr .= ", ";
            $i++;
        }
        
        $query = $this->repo->query()
            ->where('type', '===', "post")
            ->where('status', '===', "published")
            ->orderBy($sortStr);
        
        if ($limit >= 0) $query = $query->limit($limit, $offset);
        
        $docs = $query->execute();
        
        $posts = array();
        foreach ($docs as $doc) $posts[] = $this->createPostFromDoc($doc);
        
        return $posts;
    }
    
    private function setDocumentId($doc, $source) {
        $this->initDb();
        
        // restore encoded tags to original character
        $id = htmlspecialchars_decode($source);
        // all is lowercase
        $id = strtolower($id);
        // is available, use iconv to remove accents
        if (function_exists ('iconv')) $id = iconv('UTF-8', 'US-ASCII//TRANSLIT//IGNORE', $id); 
        // keep only letters, number, spaces
        $id = preg_replace('/[^a-z0-9 ]/', '', $id);
        // replace spaces with '-'
        $id = str_replace(' ', '-', $id);
        // but trim them at beginning or ending, if any
        $id = trim($id, '-');
        // set a maximum width of 50 chars
        $id = substr($id, 0, 50);
        
        // check if another doc with the same id already exists
        $sameId = $this->repo->query()
            ->where('_id', '===', $id)
            ->where('updatedAt', '!=', $doc->updatedAt) // exclude this very same doc
            ->execute();
        
        // in case, append a progressive number to the ID
        $count = $sameId->count();
        if ($count > 0) $id .= "-". ($count + 1);
        
        $doc->setId($id);
    }
    
    private function publishPost($title, $body, $tags = "[]", $draft, $token) {
        $this->throwIfNotAuth($token);
        $this->initDb();
        
        $now = date(self::DATE_FORMAT_ISO8601, time());
        $doc = new \JamesMoss\Flywheel\Document(array(
            'type'          => "post",
            'title'         => $title,
            'body'          => $body,
            'bodyFormat'    => "html",
            'tags'          => json_decode($tags, true),
            'createdAt'     => $now,
            'updatedAt'     => $now,
            'status'        => $draft ? "draft" : "published"
        ));
        
        $this->setDocumentId($doc, $title);
        $id = $this->repo->store($doc);
        
        if ($id != false) return $id;
        else throw new DatabaseException("insert failed.", self::EBL_ERROR_DB_INSERT);
    }
    
    private function updatePost($postId, $title, $body, $tags = "[]", $draft, $token) {
        $this->throwIfNotAuth($token);
        $this->initDb();
        
        $now = date(self::DATE_FORMAT_ISO8601, time());
        $res = $this->repo->query()
            ->where('_id', '===', $postId)
            ->execute();
        
        if ($res->count() == 0) {
            throw new DatabaseException("update failed, can't find document ". $postId, self::EBL_ERROR_NOTFOUND .".");
        }
        
        $doc = $res->first();
        
        if ($draft || $doc->status == "draft") $this->setDocumentId($doc, $title);
        $doc->title = $title;
        $doc->body = $body;
        $doc->tags = json_decode($tags, true);
        $doc->updatedAt = $now;
        $doc->status = $draft ? "draft" : "published";
        
        $id = $this->repo->update($doc);
        
        if ($id != false) return $id;
        else throw new DatabaseException("update failed.", self::EBL_ERROR_DB_UPDATE);
    }
    
    private function deletePost($postId, $token) {
        $this->throwIfNotAuth($token);
        $this->initDb();
        
        $this->repo->delete($postId);
    }
}

header('Content-Type: application/vnd.api+json');
if (($getRequest = isset($_GET['action'])) || ($postRequest = isset($_POST['action']))) {
    $api = new DataApi();
    $api->processAction($getRequest ? $_GET : $_POST);
}
?>