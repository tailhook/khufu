.. highlight:: javascript

===
API
===


Rendering a Template
--------------------

To use khufu, you just need to import a root template function and render it
inside the element::

    import khufu from 'khufu-runtime'
    import {main} from './template.khufu'

    khufu(document.getElementById('app'), main)

Adding support for hot reload is straightforward::

    import khufu from 'khufu-runtime'
    import {main} from './template.khufu'

    khufu(document.getElementById('app'), main)

    if(module.hot) {
        module.hot.accept()
    }


Compilation With Webpack
------------------------

Compilation of templates in webpack is just a matter of adding a loader.
You need to feed the output of the compilation to the babel::

    loaders: [{
        test: /\.khufu$/,
        loaders: ['babel', 'khufu'],
        exclude: /node_modules/,
    }]

For hot reload you need to turn off generation of static attributes. This is
a valuable optimization for production code, so do this only for development::

    khufu: {
        static_attrs: process.env['NODE_ENV'] != 'production',
    }

There is a `full example with hot-reload`__ in the sources (just note that
khufu loader path is local there, you need a package name instead).

__ https://github.com/tailhook/khufu/tree/master/examples/playground


Settings
````````

Settings are put into the ``khufu`` key in the webpack config.

static_attrs
  If ``true`` (default) means that all attribute values that compiler thinks
  are constant are put into the external array which is only used for element
  creatio and is optimized out on diff process. See `incremental-dom
  documentation`__ for more info

additional_class
  It's a string or a function that returns string. The value is a class name
  that is added to all the things:

  1. Every CSS selector in the ``style`` section
  2. Every element having at least one class name
  3. Every element that has no classes but is mentioned without classes in the
     ``style`` section too

  The last rule looks a little bit cumbersome, but it allows selectors with
  bare elements like ``div`` work as expected.

  If the setting is a function a full `webpack loader context`__ is passed as
  the first argument. Default function extracts base filename and prepends it
  with ``b-``, for example for ``/work/templates/menu.khufu`` the default name
  will be ``b-menu``.

__ http://google.github.io/incremental-dom/#rendering-dom/statics-array
__ https://webpack.github.io/docs/loaders.html#loader-context

