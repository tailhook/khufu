.. highlight:: javascript
.. default-domain:: javascript

===
API
===


Rendering a Template
--------------------

Because khufu tries to be non-opionated to what implementation of stores you
have, you need to set some parameters to
To use khufu, you just need to import a root template function and render it
inside the element (note template function is called, so you can pass
parameters to it)::

    import khufu from 'khufu-runtime'
    import {main} from './template.khufu'
    import {createStore, applyMiddleware} from 'redux'

    khufu(document.getElementById('app'), main(), {
        store(reducer, middleware, state) {
            return createStore(reducer, state, applyMiddleware(...middleware));
        }
    })

.. note:: Example uses redux_ 3.1 and ES2015

Adding support for hot reload is straightforward::

    import khufu from 'khufu-runtime'
    import {main} from './template.khufu'
    import {createStore, applyMiddleware} from 'redux'

    khufu(document.getElementById('app'), main(), {
        store(reducer, middleware, state) {
            return createStore(reducer, state, applyMiddleware(...middleware));
        }
    })

    if(module.hot) {
        module.hot.accept()
    }

Khufu Object
````````````

The object that is returned by ``khufu`` has the following methods:

.. js:function:: khufu_obj.queue_redraw

   Schedules next redraw of the view with ``requestAnimationFrame``. You don't
   have to call it manually whenever the stores in the view change. But you may
   need it if you have some external shared state which is changing.

   For example, if you have time displayed in the view::

       var khufu_obj = khufu(el, main())
       setTimeout(khufu_obj.queue_redraw, 1000)


Runtime Settings
````````````````
These are set on object passed as the third argument to
``khufu(element, template, settings)``.


.. _store_constructor:

.. js:function:: store(reducer, middleware, state)

   A function that is used to create a store. The most common one is::

        import {createStore, applyMiddleware} from 'redux'

        function store(reducer, middleware, state) {
            return createStore(reducer, state,
                applyMiddleware(...middleware));
        }

   .. warning:: The examples here use redux_ >= 3.1. Older redux can also
      be used. For example, here is how the code above can be modified for
      older redux::

            import {createStore, applyMiddleware} from 'redux'

            function store(reducer, middleware, state) {
                return applyMiddleware(...middleware)(createStore)(reducer, state)
            }

   You may add middleware and/or enhancers that must be used for every store::

        import {createStore, applyMiddleware, compose} from 'redux'
        import {DevTools} from './devtools'
        import createLogger from 'redux-logger'
        import thunk from 'redux-thunk'
        import promise from 'redux-promise'

        function store(reducer, middleware, state) {
            return createStore(reducer, state, compose(
                applyMiddleware(...middleware, thunk, promise, logger),
                DevTools.instrument()
            ));
        }

   Or using `chrome DevTools extension`__::

        import {createStore, applyMiddleware, compose} from 'redux'
        import createLogger from 'redux-logger'
        import thunk from 'redux-thunk'
        import promise from 'redux-promise'

        function store(reducer, middleware, state) {
            return createStore(reducer, state, compose(
                applyMiddleware(...middleware, thunk, promise, logger),
                window.devToolsExtension ? window.devToolsExtension() : f => f
            ));
        }

   __ https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd

   You don't have to treat everything in middleware list as redux_
   middleware. A lame example would be to allow actions to be used to seed some
   state in the store::

        function store(reducer, middleware, state) {
            let actions = middleware.filter(x => !!x.type);
            let functions = middleware.filter(x => !x.type);
            let store = createStore(reducer, state,
                applyMiddleware(...functions));
            for(let action of actions) {
                store.dispatch(action)
            }
            return store
        })

   Or you could determine if some things should actually be middleware or
   enhancer, to allow both middleware and enhancers in the template::

        function store(reducer, middleware, state) {
            let enhancers = middleware.filter(is_enhancer)
            let middleware = middleware.filter(x => !is_enhancer(x))
            return createStore(reducer, state,
                compose(
                    // redux docs say middleware should be first enhancer
                    applyMiddleware(...middleware),
                    ...enhancers));
        }

   Or just treat everything as enhancer::

        khufu(element, main(), {
            store: (r, m, s) => createStore(r, s, compose(...m)),
        })

   In the case you use something other than redux_, you may use a wrapper that
   uses redux protocol (namely methods ``dispatch``, ``getState``,
   ``subscribe``). For example, here is how you could use RxJS_ streams
   as stores (untested)::

        function store(reducer, state, middleware) {
            let current_state = state
            let subj = Rx.Subject()
            let stream = compose(...middleware)(subj)
            let store = stream.scan(reducer, state)
            store.subscribe(x => { current_state = x })
            return {
                dispatch: subj.onNext,
                getState: () => current_state,
                subscribe: store.subscribe,
            }
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

.. note:: As of webpack 2.0.7-beta you need to put the following into the
   config, we're not sure if this is a bug or a feature (the first item in
   the list needs to be added, others are by default)::

        resolveLoader: {
            mainFields: ["webpackLoader", "main", "browser"],
        }



Compilation Settings
````````````````````

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


.. _redux: https://redux.js.org
.. _rxjs: https://github.com/Reactive-Extensions/RxJS

