<article class="{$ebl->singlePost->className}" id="{$ebl->singlePost->id}">
    <header>
        <h2 class="{$ebl->class->postTitle}">{$ebl->singlePost->title}</h2>
        <span class="fa fa-calendar"></span> <time>{$ebl->singlePost->createdAt|date_format:"%d %B %Y"}</time>
    </header>

    <div>Tags: 
    {foreach from=$ebl->singlePost->tags item=tag name=tags} 
        <span>{$tag->id}{if not $smarty.foreach.tags.last}, {/if}</span>
    {/foreach}
    </div>

    <div class="{$ebl->class->postBody}">{$ebl->singlePost->body}</div>
    <div class="{$ebl->class->postComments}"></div>
</article>
    
<nav class="{$ebl->class->nav}">
    {if $ebl->case->hasNextPosts} <a href="{$ebl->links->nextPage}" class="{$ebl->class->navLink}">next</a> {/if}
    {if $ebl->case->hasPrevPosts} <a href="{$ebl->links->prevPage}" class="{$ebl->class->navLink}">previous</a> {/if}
</nav>
