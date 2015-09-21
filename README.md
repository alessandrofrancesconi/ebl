Ebl: the embeddable blog engine
===============================

Ebl is a blog engine (or platform? or framework?) created to be fast and simple but, above all, to be extremely easy to include in an existing website.

*WARNING! This repository is still in alpha release. Lots of things (like docs) are missing.*

Features
--------

Ebl, despite being very light, comes with several advantages compared with other "heavy" blog platforms:

 * First: it's ***really* light!** The core of Ebl is just a single JS library smaller than 35 KByes! You just drop it inside your `<head>` tag, tell in which container you want to put your blog and...
 * **It fits perfectly inside the webpage!** The style is inherited from your base CSS and the WYSIWYG editor shows exactly how the post will be formatted once published. Want some more catchy graphics? In this case...
 * You can customize it using **a template engine!** Very easy to understand, just write in HTML with some keywords to fill elements like the post title and the body. So what's behind the simple Javascript code? There is...
 * A **serverless database**! Let's face it, blogs don't need huge amount of data to be pushed in enormous SQL servers, right? Ebl stores all your posts as JSON files in a single, handly folder in your website. In this way...
 * It's **extremely fast**! Data access is performed (and cached) in few milliseconds and the interface is updated asyncronously while navigating. No more bottlenecks due to a slow MySQL server. It's so easy to read and export the contents of these files that...
 * You can even use an **API**! Ebl provides a set of endpoints to extract your posts and use them in other parts of the website without actually use the blog. You can, for example, extract a preview of the 3 most recent posts in your homepage.

Requirements
------------
Ebl is conceived to run on a PHP 5.3+ server and it's compatible with IE 8+, Firefox 29+, Safari 4+, Chrome.

Usage
-----

Let the code speak for me:

```
<!DOCTYPE html>
<html>
<head>
	<title>Ebl!</title>
    <script type="text/javascript" src="domready.js"></script>
    
    <!-- include the Ebl JS -->
    <script type="text/javascript" src="ebl/ebl.min.js"></script>
	
	<script type="text/javascript">
		DomReady.ready(function() {
            // wait for the page to load and tell Ebl what element to use
            Ebl.init("put-me-here");
		});
	</script>
</head>

<body>
    <!-- this div will be filled with the Ebl interface -->
	<div id="put-me-here"></div>
</body>
</html>
```

The documentation is in the works, you can have a taste [in the Wiki](https://github.com/alessandrofrancesconi/ebl/wiki).

What's powering Ebl
-------------------

Ebl whould be nothing without the help of some cool libraries:

* [Flywheel](https://github.com/jamesmoss/flywheel) for the serverless database
* [Tobscure's JSON API](https://github.com/tobscure/json-api) to build a well-formatted API in PHP
* [Smarty](http://www.smarty.net/), a fast and simple PHP template engine
* [wysihtml](http://wysihtml.com/), the typewriter for the modern web
* [AlertifyJS](http://alertifyjs.com/), for beautiful web dialogs
* [FontAwesome](https://fortawesome.github.io/Font-Awesome/), for awesome icons