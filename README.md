Khufu
=====


|              |                                           |
|--------------|-------------------------------------------|
|Documentation | http://tailhook.github.io/khufu/          |
|Demo          | http://tailhook.github.io/khufu/demo.html |
|Status        | beta [¹](#1)                              |


At a glance, Khufu is a template-engine for [incremental-dom].

But more characteristically I call it is a domain-specific language (DSL) for
view-driven single-page applications.

The boring list of features:

* Nice, compact, indentation-based syntax, designed for readability
* Rich-enough subset of javascript is allowed right in the template
* Styles in the same file as view (HTML), properly namespaced
* Avoids separate code to compose [redux] stores (kinda auto-generates it)
* Supports webpack hot module replacement (aka hot reload)

<a name=1>[1] **More verbose status:** I feel that the language itself (the syntax) is
   90% complete (thanks to it's [predecessor]). There are ugly edge cases of the
   compiler here and there. And the server-side render is not implemented yet.
   Otherwise, the project is small enough to just work.


Installation
------------

```sh
npm install khufu@0.4.5 --save-dev
npm install khufu-runtime@0.4.5 --save
```


Why?
----

1. JSX is ugly. Mixing javascript and HTML is ugly
2. Conversely, I want to mix CSS with HTML and enough dynamic features [²](#2)
3. I'm tired of composing views and stores independently [³](#3)

<a name=2>[2] Indentation-based syntax is a bonus.<br>
<a name=3>[3] Sure, the model proposed here doesn't work for everyone.

So What Is It?
--------------

It's mostly a DSL around HTML, that looks a lot like just a template language
similar to [Jade], that compiles into Incremental DOM.
Additionally Khufu:

1. Reuses incremental dom diffing algorithm to diff [redux] or [flux]-like stores
2. Allows to write styles in the same file which are **properly namespaced**
   without long ugly prefixed like in [BEM]


So What is "View-Driven"?
-------------------------

It means when you design an application you build a single powerful view. And
all server-side data are fetched when a user enters some subview and is disposed
when user leaves the view (of course, data can be prefetched and cached, but
that's optimization orthogonal to what we're discussing here).

For example:
```javascript

    import {search, set_query} from 'myapp/search'
    import {image, load} from 'myapp/util/image_loading'
    import {select} from 'myapp/action_creators'

    view main():
      <div>
        store @results = search
        <form>
          <input type="text" placeholder="search">
            link {change, keyup} set_query(this.value) -> @results

        if @results.current_text:
          if @results.loading:
            <div.loading>
              "Loading..."
          else:
            <div.results>
            for item of @results.items:
              <div.result>
                store @icon_loaded = image | load(item.img)
                if @icon_loaded.done:
                    <img src=item.img>
                else:
                    <div.icon-loading>
                <div.title>
                    item.title
```
This example displays a search box. When some search query is typed into the
input box, search request is sent to the server immediately[⁴](#4). This displays
"Loading..." stub and replaces the stub with the results when they are loaded
from a server. There is also the code to download images asynchronously.

Some explanations:

1. Nesting of elements is denoted by indentation, hence no closing tags
2. ``div.cls`` is shortcut for ``<div class="cls">``
3. ``store`` denotes a [redux] store
4. ``link`` allows to bind events to an action (or an action creator)

The store thing might need a more comprehensive explanation:

1. Stores are lexically scoped
2. More so, on each loop iteration we get new scope
3. Diffing algorithm of incremental-dom drops unused stores automatically
4. They provide lifecycle hooks, so can dispose resources properly[⁵](#5)
5. Store is prefixed by ``@`` to get nice property access syntax[⁶](#6)

<a name=4>[4] Sure, you can delay requests by adding [RxJS] or [redux-saga]
or any other middleware to the store<br>
<a name=5>[5] Yes, we attach resources (such as network requests) to stores,
using middleware<br>
<a name=6>[6] Otherwise would need to call ``getState()`` each time. We also
cache the result of the method for subsequent attribute access

Isn't it Like Good Old HTML?
----------------------------

Right. You do a Khufu view, add events and everything works. Just like you
have been doing HTML page and add [jQuery] plugins to make that work.

There are few crucial improvements, however:

1. All your variables are properly namespaced (and styles too). So there is no
   global identifiers which prevent composing and reusing things
2. This plays well with javascript module system (every template is a module,
   imports work, and so on)
3. The updates of fragments are much better using virtual DOM

You can also think of each view function being a component
similar to what you find in [react] or [angular]. Have I said that syntax is
much more readable?


[flux]: https://facebook.github.io/react/blog/2014/05/06/flux.html
[redux]: http://redux.js.org/
[jade]: http://jade-lang.com/
[incremental-dom]: https://github.com/google/incremental-dom
[bem]: http://getbem.com/
[jquery]: https://jquery.com/
[react]: https://facebook.github.io/react/
[angular]: https://angularjs.org/
[RxJS]: https://github.com/acdlite/redux-rx
[redux-saga]: https://github.com/yelouafi/redux-saga
[predecessor]: http://github.com/tailhook/marafet
