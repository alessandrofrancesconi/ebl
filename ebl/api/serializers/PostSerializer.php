<?php

require ("TagSerializer.php");

class PostSerializer extends Tobscure\JsonApi\AbstractSerializer
{
    protected $type = 'post';
        
    protected function getAttributes($post)
    {
        return [
            'title'         => $post->title,
            'body'          => $post->body,
            'bodyFormat'    => $post->bodyFormat,
            'createdAt'     => $post->createdAt,
            'updatedAt'     => $post->updatedAt,
            'status'        => $post->status,
        ];
    }
    
    protected function tags()
    {
        return function ($post, $include, array $included, array $linked) {
            $serializer = new TagSerializer($included, $linked);
            
            $serializerTags = array();
            if ($include) $serializerTags = $post->tags;
            else foreach ($post->tags as $t) $serializerTags[] = $t->id;
            
            $tags = $serializer->collection($serializerTags);
            if ($tags != null) return new Tobscure\JsonApi\Relationship($tags);
            else return null;
        };
    }
}

?>