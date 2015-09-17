<?php

class SessionSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'session';
    
    protected function getId($session)
    {
        return "_session";
    }
    
    protected function getAttributes($session)
    {
        return [
            'logged'    => $session->logged,
            'token'     => $session->token,
        ];
    }
}
