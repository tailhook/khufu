.. Khufu documentation master file, created by
   sphinx-quickstart on Wed Jan  6 20:18:06 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Khufu's documentation!
=================================

Khufu is a template engine for incremental-dom_ (which is one of virtual DOM
implementations) that allows you to add properly scoped CSS styles and some
temporary redux_ stores directly into the template syntax. The generated output
is a javascript module which requires **less than 20Kb** of runtime (including
the incremental-dom_ and redux_).  See more on intent of creating the product
in `README`__

__ https://github.com/tailhook/khufu/blob/master/README.rst

Contents:

.. toctree::
   :maxdepth: 2

   syntax
   demo
   api


.. _incremental-dom: https://github.com/google/incremental-dom
.. _redux: http://redux.js.org/

