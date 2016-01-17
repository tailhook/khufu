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


View Blocks
-----------


.. _babel: https://babeljs.io/
