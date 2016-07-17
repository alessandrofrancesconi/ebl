<?php

class ResultSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'result';

    public function getId($res)
    {
        return "_result";
    }
    
    public function getAttributes($res, array $fields = null)
    {
        return [
            'message' => "Operation completed."
        ];
    }
}

?>