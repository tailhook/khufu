============
Khufu Syntax
============

.. highlight:: khufu


Overview
========

1. Syntax has significant line endings, no semicolons are allowed
2. Blocks are denoted by identation
3. Between any kind of parenthesis (``{([])}``) the newlines and indentation
   loose their meaning. Same thing in element-denoting angle-brackets ``<>``,
   but not for less/greater sigils (which are also ``<`` and ``>``) in
   expressions
4. In places where an expression expected, such as text of element or attribute
   value, the javascript rules for expressions are used, with few limitations
5. Blocks ``view``, ``style``, ``for``, ``if``, ``elif``, ``else`` require
   the colon before indented block, just like in python


.. hint:: We have a :ref:`demo` page showing some useful code examples


Global Scope
============

There are three kinds of global statements: ``import``, ``view``
and a ``style``.

Note that ``view xxx():`` and ``style:`` blocks do start with a colon ``:``
at the end of line and element's content is indented.


Import Statements
-----------------

Import statements are exactly the same as in ES2015 Javascript, except
obviously, you don't need a semicolon:

::

    import {a, b} from 'module'

::

    import module from 'module'

::

    import * as module from 'module'

The khufu doesn't actually do anything special to the statement and outputs
it in a similar fashion to the generated javascript file (which is usually
further processed by babel_). That means that you
can import anything that webpack (or whatever tool you use for building) is
able to import.

**Convention:** Import statements are usually grouped at the top of the file
before any blocks.


Style Blocks
------------

The ``style`` block allow you to write a style sheet right in the file.
Like everything in ``*.khufu`` file, style blocks are indentation based.
But there are more special things about style blocks, except syntax:

1. Selectors are limited to: elements, classes and pseudo-elements
2. Every style sheet rule implicitly includes a class name of this block

The rule #1 is important for making performance of the style sheet great. Like
you don't have nesting elements and so on. We feel that you have enough khufu
instruments to achieve same goal without nested selectors and similar things.
Of course, you can attach an external stylesheet to the page, if you have
specific needs (like styling user HTML, which needs complex hierarchy of rules).

The rule #2 means that if you compile a file ``regform.khufu``, every ``p``
selector will actually be ``p.b-regform`` and every ``.btn.btn-success``
selector will be compiled to ``.b-regform.btn.btn-success``. This allows to
namespace styles easily.

Here is a rough example of style block::

    style:
      .bar1, bar2
        margin: 4px

      p
        display: flex
        flex-direction: column
        width: 300px
        align-items: center

      input
        border-radius: 5px
        padding: 2px 4px

You can wrap property lines with indentation and also add the line comments,
like this::

    style:
      div
        margin:
          12px  // left
          8px   // top
          12px  // right
          8px   // bottom


.. note:: By default we add ``b-blockname`` class only for elements that:
   (a) already have a class name or (b) mentioned by bare class name in the
   ``style`` block.

**Convention** Usually you need a single ``style`` block which is at the
start of the file immediately following the ``import`` statements but before
any ``view``.


.. _view-blocks:

View Blocks
-----------

The ``view`` block definition defines a function which renders virtual DOM (in
particular of incremental-dom_ kind) for some HTML fragment.

It also allows to anchor redux_ stores to particular nodes of the virtual DOM
tree.

The ``view`` statement defined a plain javascript function, for example::

    view main(x):
      x

Defines and exports function that renders bare text node, equivalent to the
following javascript:

.. code-block:: javascript

    import {text} from 'incremental-dom'
    export function main(x) {
        text(x)
    }

If you don't want to export the function, just prefix it with underscore::

    view _helper(value, defvalue):
        if value == defvalue:
            "<default>"
        else:
            value

This creates internal function named ``_helper``.

More information in :ref:`views` section.


.. _views:

View Definition
===============

This section defines what to write **inside** the ``view`` section.
For instructions writing view function signature see :ref:`view-blocks`.
Everthing described below can only be used in ``view`` function.


Elements
--------

The most useful thing is creating an expression. You create expression by
starting HTML-like angular-bracket tag **at the start of a line** after
indentation, for example::

    <p>

Writing attributes look a lot like in HTML::

    <p align="left">

But actually the attribute value is a limited kind of javascript expression.
For example you might write::

    <p align=x>

But you can't write complex expressions here like ``align=x+x`` instead you
may either use ``let`` syntax or wrap the expression in parenthessis::

    <p size=(x+y)>

In angular-brackets you might wrap line as you wish::

    <p class="big-paragraph"
       align="left">

There is never need to write an ``onclick`` or similar event handler directly
inside the attribute. See ``link`` for an idea of how we work with events.

We have a short syntax for defining ``class`` attribute, similar to one used
in CSS::

    <p.big-paragraph>

Additionally we have syntax for optional styles::

    <p.pagragraph.justified?(settings.is_justified)>

Any valid expression is allowed in ``?(..)`` and the operator is only applied
to a class immediately preceeding the operator, ``justified`` in the case
above, but you can use it multiple times. The parenthesis are the part of the
operator and *no alternative* value (like in ternary ``x ? y : z`` operator) is
present.

Elements can be nested, and text nodes (see below) can be inside the tag::

    <p>
      "Here is a link"
      <a.download-link href="http://example.org/download" download>
        "to download file"

The element is a basis for defining scope of things in khufu. For example,
``store`` is linked to the element where it is defined. The ``store`` and
``let`` variables are limited to the element scope.

You can't write anything on the same line after closing angular bracket.


Text Nodes
----------

Every expression, that is not an element or one of the special argument below,
is treated as a javascript expression defining text node. For example::

    <ul>
      <li>
        "This is a string"
      <li>
        x + y
      <li>
        some_fn()

All three ``<li>`` elements above have a text node inside. In the first case
the text is just a constant string value. For the second element the expression
``x + y`` is evaluated, and whatever javascript decides is the result of the
expression it will be inserted into a text node.

The ``some_fn()`` case may work the same. If it returns a non-undefined value
it will be used as a text value. But because of how incremental-dom_ works, it
may also output any HTML elements. And this is exactly a way to call views for
another views.

There are two precautions:

1. Don't write functions which both output HTML and return the value. While it
   will work it is extremely confusing to users and may not work for
   alternative compilers
2. All ``undefined`` and ``null`` values are **suppressed**


Stores
------


Links
-----


Let Statements
--------------


If Statements
-------------


For Statements
--------------



.. _babel: https://babeljs.io/
.. _incremental-dom: https://github.com/google/incremental-dom
.. _redux: http://redux.js.org/

