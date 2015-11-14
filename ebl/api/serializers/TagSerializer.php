<?php

class TagSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'tag';
        
    public function getAttributes($tag, array $fields = null)
    {
        return [
            //'name' => $tag->name TODO?
        ];
    }
}

?>