=====
Khufu
=====

At a glance Khufu is a template-engine for incremental-dom_.

But more characteristically I call it view-driven micro-framework for
single-page applications.

Why?
====

1. JSX is ugly. Mixing javascript and HTML is ugly
2. I want to mix CSS with HTML enough dynamic features [*]

.. [*] Indentation-based syntax is a bonus.


So What Is It?
==============

It's mostly a DSL around HTML, that looks a lot like just a template language
similar to Jade_, that compiles into Incremental DOM.
Additinally Khufu:

1. Khufu reuses incremental dom diffing algorithm to diff flux_-like stores
2. Allows to write styles in the same file which are **properly namespaced**
   without long ugly prefixed like in BEM_

So What is "View-Driven"?
=========================

It means when you design an application you design a single powerful view. And
all server-side data are fetched when user enters some subview and is disposed
when user leaves the view (of course, data can be prefetched and cached, but
that's optimization orthogonal to what we're discussing here).

For example::

    view main(choose_item):
        <form>
            store current_search = new Text()
            <input type="text" placeholder="search">
                link change = current_search

        if current_search.value:
            store results = new AjaxCall('/search', current_search.value)
            if results.loading:
                <div.loading>
                    "Loading..."
            else:
                <div.results>
                for item in results.items:
                    <div.result>
                        store icon_loaded = new ImageLoad(item.img)
                        if icon_loaded.done:
                            <img src=item.img>
                        else:
                            <div.icon-loading>
                        <div.title>
                            link click = item.id -> choose_item
                            item.title

This example displays search box and if some search query is typed into the
input box, search request is sent to the server immeditely. Displaying
"Loading..." stub and results when they are loaded from server. There are also
code to download images aynchronously.

Some explanations:

1. Nesting of elements is denoted by indentation, hence no closing tags
2. ``div.cls`` is shortcut for ``<div class="cls">``
3. ``store`` denotes a special variable, that persists data between re-renders
4. ``link`` ties and event on the element to handler and may send some data

The store thing might need a more comprehensive explanation:

1. Stores are lexically scoped
2. More so, on each loop iteration we get new scope
3. Diffing algorithm of incremental-dom drops unused stores automatically
4. They provide lifecycle hooks, so can dispose resources properly
5. Otherwise they are just variables that you can use however you want


Isn't it Like Good Old HTML?
============================

Right. You do a Khufu view, add events and everything works. Just like you
have been doing HTML page and add jQuery_ plugins to make that work.

**Except you get proper scopes and namespaces**. I mean you never give elements
globally accessible id attribute or something that prevents them to be reused
and composed. You can also think of each view function being a component
similar to what you find in react_ or angular_.


.. _flux: https://facebook.github.io/react/blog/2014/05/06/flux.html
.. _jade: http://jade-lang.com/
.. _incremental-dom: https://github.com/google/incremental-dom
.. _bem: http://getbem.com/
.. _jquery: https://jquery.com/
.. _react: https://facebook.github.io/react/
.. _angular: https://angularjs.org/
