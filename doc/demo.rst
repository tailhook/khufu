.. _demo:

=========
Live Demo
=========


Simple Counter
==============

This is about as small demo as possible:

.. raw:: html

   <iframe src="examples/counter/index.html" frameborder="0"
    width="400" height="45"></iframe>
   <p align="right">
     <a href="https://github.com/tailhook/khufu/tree/master/examples/counter"
        target="_newtab">Source</a> /
     <a href="examples/counter/index.html" target="_newtab">Open in New Tab</a>
   </p>

The template:

.. literalinclude:: ../examples/counter/counter.khufu
   :language: khufu

Bootstrap code (`index.js`):

.. literalinclude:: ../examples/counter/index.js
   :language: javascript

And the counter store `counter.js`.

.. literalinclude:: ../examples/counter/counter.js
   :language: javascript

This is just simple redux_ store and an action creator.


Debounce
========

This example demonstrates use of redux-saga_ for debouncing the event stream:


.. raw:: html

   <iframe src="examples/debounce/index.html" frameborder="0"
    width="400" height="200"></iframe>

   <p align="right">
     <a href="https://github.com/tailhook/khufu/tree/master/examples/debounce"
        target="_newtab">Source</a> /
     <a href="examples/debounce/index.html" target="_newtab">Open in New Tab</a>
   </p>

This example shows scoping of stores and how to define stores and middlewares
dynamically:

.. literalinclude:: ../examples/debounce/text.khufu
   :language: khufu
   :lines: 21-

And here is a ``delay_saga`` middleware:

.. literalinclude:: ../examples/debounce/delay.js
   :language: javascript
   :lines: 19-

This looks more complex than ``stream.debounce(x)`` from RxJS_, but it's
because we don't use any function defined by library, but rather implementing
functionality ourselves. Sure you can use redux-rx_ or any other stuff.
It's just a demo, khufu does **not** require to use redux-saga_.

.. _redux-saga: https://github.com/yelouafi/redux-saga
.. _redux: http://redux.js.org/
.. _rxjs: https://github.com/Reactive-Extensions/RxJS
.. _redux-rx: https://github.com/acdlite/redux-rx


Components
==========

Here is a simple demo for a component *label* that has a ``body`` and
a ``badge`` placeholders:

.. raw:: html

   <iframe src="examples/components/index.html" frameborder="0"
    width="400" height="100"></iframe>

   <p align="right">
     <a href="https://github.com/tailhook/khufu/tree/master/examples/components"
        target="_newtab">Source</a> /
     <a href="examples/components/index.html" target="_newtab">Open in New Tab</a>
   </p>


Template code is as simple as:

.. literalinclude:: ../examples/components/components.khufu
   :language: khufu
   :lines: 12-


Error Handling
==============

Following is a demo of error handling:

.. raw:: html

   <iframe src="examples/errors/index.html" frameborder="0"
    width="100%" height="100"></iframe>

   <p align="right">
     <a href="https://github.com/tailhook/khufu/tree/master/examples/errors"
        target="_newtab">Source</a> /
     <a href="examples/errors/index.html" target="_newtab">Open in New Tab</a>
   </p>

Note, how setting "bad value" breaks the rendering immediately. But setting
a good value doesn't do, unless retry action is also executed. This is because
the code looks like this (stripped some details::


  <div>
    store @fruits = Fruits
    store @has_error = Flag
    if not @has_error:
      catch * set_true() -> @has_error:
        <b> @fruits.banana.price
    else:
      <button>
        link {click} set_false() -> @has_error
        "Retry"

    <button>
      link {click} good_value() -> @fruits
      "Set good value"

I.e. if ``@fruits`` store is updated, and ``@has_error`` still contains
``true`` the catch block isn't rerendered, but obviously if there was no error
and store value changed, the template will rerender and drop into an errorneous
state.
