<?php

class ResultSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'result';

    protected function getId($res)
    {
        return "_result";
    }
    
    protected function getAttributes($res)
    {
        return [
            'message' => "Operation completed."
        ];
    }
}

?>