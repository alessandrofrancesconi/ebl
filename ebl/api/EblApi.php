<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

require ("utils.php");
require ("../libs/Flywheel/Formatter/FormatInterface.php");
require ("../libs/Flywheel/Formatter/JSON.php");
require ("../libs/Flywheel/Config.php");
require ("../libs/Flywheel/Repository.php");
require ("../libs/Flywheel/DocumentInterface.php");
require ("../libs/Flywheel/Document.php");
require ("../libs/Flywheel/Query.php");
require ("../libs/Flywheel/QueryWhere.php");
require ("../libs/Flywheel/QueryFilter.php");
require ("../libs/Flywheel/CachedQuery.php");
require ("../libs/Flywheel/Result.php");


abstract class EblApi {
    
    const EBL_VERSION_STRING = "0.1";
    const EBL_VERSION_CODE = 0;
    
    // 2xx codes
    const EBL_SUCCESS =                     200;

    // 4xx codes
    const EBL_ERROR_BADREQUEST =            400;
    const EBL_ERROR_AUTH_NOTLOGGED =        401;
    const EBL_ERROR_AUTH_SHORTACCESS =      429;
    const EBL_ERROR_AUTH_NOADMIN =          450;
    const EBL_ERROR_AUTH_ALREADYADMIN =     451;
    const EBL_ERROR_AUTH_TOOMANYADMINS =    452;

    // 5xx codes
    const EBL_ERROR_INTERNAL =              500;
    const EBL_ERROR_DB_ACCESS =             550;
    const EBL_ERROR_DB_INSERT =             551;
    const EBL_ERROR_DB_SELECT =             552;
    const EBL_ERROR_DB_UPDATE =             553;
    
    const DATE_FORMAT_ISO8601 = "Y-m-d\TH:i:s";
    
    protected $repo = null;

    function __construct() {
        date_default_timezone_set("UTC");
        
        $this->workingPath = dirname(__FILE__);
        $this->initSession();
    }
    
    abstract public function processAction($args);
    
    private function initSession() {
        session_name("EblSession");
        session_set_cookie_params(60 * 60 * 24 * 7); // 7 days
        session_start();
    }
    
    protected function initDb() {
        if ($this->repo != null) return; // already initialized
        
        $db = new \JamesMoss\Flywheel\Config($this->workingPath . "/..");
        try { $this->repo = new \JamesMoss\Flywheel\Repository("db", $db); }
        catch (RuntimeException $e) { throw new DatabaseException("problem accessing the DB: ". $e->getMessage(), self::EBL_ERROR_DB_ACCESS); }
    }
    
    protected function verifyAdminData($expectedCount) {
        $this->initDb();
        
        $adminData = $this->repo->query()
            ->where('type', '===', "adminData")
            ->execute();
        
        $dataCount = $adminData->count();
        if ($dataCount != $expectedCount) {
            if ($dataCount == 0) throw new DatabaseException("admin not created", self::EBL_ERROR_AUTH_NOADMIN);
            else if ($dataCount == 1) throw new DatabaseException("admin already created", self::EBL_ERROR_AUTH_ALREADYADMIN);
            else throw new DatabaseException("too many admins", self::EBL_ERROR_AUTH_TOOMANYADMINS);
        }
        else return $adminData->first();
    }
    
    protected function throwIfNotAuth($token) {
        if (!$this->getLoggedState()) {
            throw new SessionException("admin not logged", self::EBL_ERROR_AUTH_NOTLOGGED);
        }
        else if (!(isset($_SESSION['ebl_token']) && (strcmp($_SESSION['ebl_token'], $token) == 0))) {
            throw new SessionException("wrong token", self::EBL_ERROR_AUTH_NOTLOGGED);
        }
    }
    
    protected function getConfigValues($configArray, $requestedValues) {
        $out = array();
        foreach ($requestedValues as $value) {
            if (!array_key_exists($value->name, $configArray)) {
                if ($value->required) throw new InvalidArgumentException("missing required parameter '". $value->name ."' from config values", self::EBL_ERROR_BADREQUEST);
                else if ($value->filter == FILTER_VALIDATE_BOOLEAN) $out[$value->name] = false;
                else if ($value->filter == FILTER_VALIDATE_INT) $out[$value->name] = 0;
                else $out[$value->name] = null;
            }
            else $out[$value->name] = $value->filter != null ? filter_var($configArray[$value->name], $value->filter) : $configArray[$value->name];
        }
        
        return $out;
    }
    
    protected function getLoggedState() {
        return (isset($_SESSION['ebl_logged']) && ($_SESSION['ebl_logged'] === true));
    }
    
    protected function createPostFromDoc($doc = null) {
        $now = date(self::DATE_FORMAT_ISO8601, time());
        $post = new stdClass();
        $post->id = ($doc != null ? "ebl-post_".$doc->getId() : null);
        
        $post->title = ($doc != null ? $doc->title : null);
        $post->body = ($doc != null ? $doc->body : null);
        $post->bodyFormat = ($doc != null ? $doc->bodyFormat : null);
        
        $post->createdAt = ($doc != null ? $doc->createdAt : $now);
        $post->updatedAt = ($doc != null ? $doc->updatedAt : $now);
        $post->status = ($doc != null ? $doc->status : "draft");
        
        $post->tags = ($doc != null ? $doc->tags : array());
        
        return $post;
    }
}

class EblConfigValue {
    public $name;
    public $filter;
    public $required;
    
    function __construct ($n, $f, $r) {
        $this->name = $n;
        $this->filter = $f;
        $this->required = $r;
    }
}

class SessionException extends Exception { }
class DatabaseException extends RuntimeException { }

?>