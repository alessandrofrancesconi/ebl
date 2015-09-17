{foreach $ebl->previews as $post}
<article class="{$post->className}" id="{$post->id}">
    <header>
        <h2 class="{$ebl->class->postTitle}"><a href="{$post->permaLink}" class="{$ebl->class->postLink}">{$post->title}</a></h2>
        <span class="fa fa-calendar"></span> <time class="{$ebl->class->postDate}">{$post->createdAt|date_format:"%d %B %Y"}</time>
    </header>
    <div class="{$ebl->class->postBody}">{$post->body}</div>
</article>
{/foreach}

<nav class="{$ebl->class->nav}">
    {if $ebl->case->hasNextPosts} <a href="{$ebl->links->nextPage}" class="{$ebl->class->navLink}">next</a> {/if}
    {if $ebl->case->hasPrevPosts} <a href="{$ebl->links->prevPage}" class="{$ebl->class->navLink}">previous</a> {/if}
</nav>
