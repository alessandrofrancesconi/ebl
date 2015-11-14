<?php

class SessionSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'session';
    
    public function getId($session)
    {
        return "_session";
    }
    
    public function getAttributes($session, array $fields = null)
    {
        return [
            'logged'    => $session->logged,
            'token'     => $session->token,
        ];
    }
}
