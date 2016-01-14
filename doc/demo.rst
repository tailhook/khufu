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
     <a href="examples/counter/index.html" target="_newtab">Open in New Tab</a>
   </p>

The template:

.. literalinclude:: ../examples/counter/counter.khufu

Bootstrap code (`index.js`):

.. literalinclude:: ../examples/counter/index.js

And the counter store `counter.js`:

.. literalinclude:: ../examples/counter/counter.js


Debounce
========

This example demonstrates use of redux-saga_ for debouncing the event stream
(you can actually do any processing for events in the saga):


.. raw:: html

   <iframe src="examples/debounce/index.html" frameborder="0"
    width="400" height="200"></iframe>

   <p align="right">
     <a href="examples/debounce/index.html" target="_newtab">Open in New Tab</a>
   </p>

.. _redux-saga: https://github.com/yelouafi/redux-saga
