<?php

class TagSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'tag';
        
    protected function getAttributes($tag)
    {
        return [
            //'name' => $tag->name TODO?
        ];
    }
}

?>