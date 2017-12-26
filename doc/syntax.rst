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
6. See `The Javascript Parlance`_ section for the expression language
   description
7. Be sure to read `No Side Effects Rule`_ section


.. hint:: We have a :ref:`demo` page showing some useful code examples

.. note:: We refer to redux_ stores in multiple places. Actually you can
   :ref:`customized what kind of stores to use<store_constructor>`


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

.. _dictionary-view:

Also you can create a dictionary (i.e. object) of views and access them using
a variable::

    view helpers.italic(text):
        <i> text

    view helpers.bold(text):
        <b> text

    view main(kind, text):
        helpers[kind](text)

The name of the ``helpers`` object can be arbitrary. And as with normal
views this variable is exported if name does not start with underscore (the
second part of the name isn't checked for underscore). Multiple such
dictionaries may be declared. Nesting is not supported.

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

And ES2015 (ES6) templates are supported too::

    <a href=`http://${host}/${path}`>

In angular-brackets you might wrap line as you wish::

    <p class="big-paragraph"
       align="left">

There is never need to write an ``onclick`` or similar event handler directly
inside the attribute. See ``link`` for an idea of how we work with events.

.. note:: Unlike in incremental-dom_ by default we set boolean attributes using
   property (``el[x]``) instead of ``el.setAttribute(x)``. This works better
   for attributes like ``checked``.

We have a short syntax for defining ``class`` attribute, similar to one used
in CSS::

    <p.big-paragraph>

Additionally we have syntax for optional styles::

    <p.paragraph.justified?(settings.is_justified)>

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

You can write strings and simple expressions (attributes, function calls,
template expressions) on the same line as tag if they are the only element
in the tag:

    <p>
      <b> "bold"
      <i> data.italic
      <u> capitalize("underline")


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
        `Hello ${ generate name() }`

All three ``<li>`` elements above have a text node inside. In the first case
the text is just a constant string value. For the second element the expression
``x + y`` is evaluated, and whatever javascript decides is the result of the
expression it will be inserted into a text node. The third element uses
template string as defined in ES2015 (ES6) (currently only bare backticks
are supported no custom prefix).

Note that bare function calls like ``fun(x, y)`` also may work as
`Subviews`_


Stores
------

The ``store`` statement let you declare a redux_ store, for example::

    import {counter} from './counter'
    view main():
      <p>
        store @x = counter

The stores are always denoted by ``@name``. In expression context the store
name resolves to it's state, for example::

    <span>
      "Counter value: " + @x
      "Next value: "
      <input disabled value=(@x + 1)>

Attribute access and methods calls are supported, too::

    store @m = immutableJsMapStore
    "Primary: " + @m.get('primary_value')
    for key of @m.keys():
        "Additional key: " + key

.. note:: Stores may appear only directly inside the element. This is how our
   diffing technique works: if element is removed, we remove the store too. If
   on the next rerender the element is still rendered, the store is reused.

You may apply middlewares to store. For example, here is our imaginary
middleware that initializes the store with a value::

    store @m = reducer | init('value')

Multiple middlewares may be used::

    store @m = reducer | init('value') | thunk | logger

Middlewares can also be written on the following lines. In that case, they
must be indented and only single middleware per line allowed::

    store @store_name = reducer | init('value')
        | createLogger({level: 'debug', duration: true, collapsed: true})

You shoudn't apply logger here, but rather use it globally, by suplying custom
:ref:`store initialization function<store_constructor>`. In the function you can
also influence how middlewares are treated. For example, you can accept store
enhancers instead of middlewares in the template code.  See :ref:`API
documentation<store_constructor>` for more info.

Ocasionally, you may find it useful to import a store::

    import {@router} from './myrouting'

    view main():
        if @router.current_page == '/home':
            ...

Since khufu 0.5 the stores are just like variables. So you can access
methods on ``router`` above without the AT sign. And pass the store as an
argument to the function (with ``@`` sign it will pass the state vaule, so you
can't send event there)::

    view button(name, num, @mystore):
      <button>
        link {click} incr(num) -> @mystore
        name

    view main():
      <div>
        store @cnt = createStore(Counter)
        button('+1', +1, cnt)
        button('-1', -1, cnt)
        <input value=@cnt>

See `Links`_ section for the description of ``link .. -> @store`` syntax.

The ``@`` anotation in function definition is mere annotation to show that
you will be using the variables as a store, it has no special meaning.

.. note::

   Previously ``-> @`` operator was used to pass a store as an argument, it's
   still supported, but is deprecated.

   .. versionchanged:: 0.5.0

The ``createStore`` function above, in many cases isn't just the one from
module ``redux``. It's often some more elaborate store creator with a
middleware. The powerful examples of middleware are redux-saga_ and
and redux-rx_.

See `redux documentation`__ for more information on actions, stores and
middlewares.

__ http://redux.js.org/


Links
-----

The ``link`` statement allows you to create an event handler that sumbits
and event to the store. For example::

    import {crateStore} from 'redux'
    import {counter, incr} from './counter'
    view main():
      <p>
        store @counter_store = createStore(counter)
        <button>
          link {click} incr() -> @counter_store

In the example ``counter`` is a "reducer" in terms of redux_. Where redux uses
terms store and reducer mostly interchangeably. The ``incr`` is an action
creator. Which means it's utility is to create an action object.

The action object is dispatched within the redux store by calling
``counter_store.dispatch(incr())`` when ``onclick`` event happens.

In the link expression there are two implicit variables (see examples below):

* ``event`` which is browser's event object
* ``this`` the element which has the event handler

Mutliple event handlers may be bound at once::

  <input type="text">
    link {change, keyup, keydown, blur} set_text(this.value) -> @user_input

And if you need more details on the actual event happened just pass the
event to an action creator::

  <input type="text">
    link {keyup, keydown} key_press(event) -> @ui_state


Let Statements
--------------

Let statements allows to bind a variable to some value. Used mostly for
shortcut variables::

  let img = user.get('avatar').small_image
  <img src=img.src width=img.width height=img.height>

The ``let`` bindings are scoped to the block they are used in. For example::

  let x = "outer"
  <p>
    let x = "inner"
    x
  if true:
    let x = "if_var"
    x
  <p>
    x

Will generate the following html:

.. code-block:: html

   <p>inner</p>if_var<p>outer</p>

There is **no assigment** statement or expression. So basically all variables
behave like javascript ``const`` declarations. But conflicting names are not
discouraged, so you can rebind a variable::

    let text = @user_input
    "Raw user input: " + text + ", "
    let text = validate_and_clean(text)
    "Validated user input: " + text


If Statements
-------------

If statements define conditional blocks of a template::

    if @user_input.length == 0:
      <p>
        '-- no value --'

There are also ``elif`` and ``else`` blocks::

    if @user_input == "":
      <b>
        "Please, enter some value"
    elif @user_input == 'fruits':
      "apple, banana"
      <input type="button" value="add fruit">
    elif @user_input == 'vegetables':
      "tomato, carrot"
    else:
      "unknown request"

Any mix of elements, text nodes and function calls can be in each block. You
can't have optional ``link``. Currently to add an optional ``store`` you need
to wrap it into a HTML element.

.. _if-let:

If-Let Statements
-----------------


If-let statements allow to assign the result of successful condition::

    if let match = regex.exec(value):
      <p>
        match.$1

They can be combined with regular ``if`` statements freely, and are
particluarly useful for routing::

    if path == '/':
        index_page()
    elif let [_, object_id] = regex("/obj/(\\d+)").match(path):
        object_page(object_id)
    else:
        not_found_page()

*(the example above might not be optimal both for preformance and for
clarity, just an example, you may want a better abstraction)*



For Statements
--------------

For statement allows to iterate over a collection::

  <ul>
    for item of ["apple", "banana", "cherry"]:
      <li>
        item

There is only a ``for..of`` loop, to iterate over the keys of the object or
to iterate over the range of integer values you need a helper function.
Otherwise any ES2015 iterator will work, for example you may use one from
the immutablejs_::

  <ul>
    for item of map.keys():
      item

Since we are building virtual DOM (incremental-dom_) and not plain HTML, every
loop needs a key to have diffing algorithm work well. By default the key is a
string representation of the item, but it can be either non-useful (if you are
iterating over the objects) or not efficient enough. You can override it
easily::

    for obj of items key obj.id:
        <a href=("/objects/" + id)>
          obj.title

Note that unlike in react_ and many other virtual DOM implementations, you
don't put ``key`` onto the element itself. It's the property of the loop. And
khufu is smart enough to add a suffix to a key if you have more than one
element in the loop body.

You can use destructuring for the loop variables, but in that case specifying
``key`` is mandatory::

    for [name, objects] in map.entries() key name:
      <div>
        name
        for {id, color, title} in objects key id:
            <span style={color: color}>
                title

The variables in a loop as well as a variable in the ``for`` statement itself
is scoped to a loop iteration. So events work as expected::

    for obj of @objects key obj.id:
      let image = obj.image
      <input type="image" src=image.url>
        link {click} edit_image(image.id) -> @objects
      <input type="button" value="remove_object">
        link {click} remove(obj.id) -> @objects

.. _catch:

Catch Statements
================

Catch statements are some kinds of error boundary. If error occurs within
the block, error is caught and specified action is dispatched on the store.
Here is some usage example::

    store @err_store = value
    if not @err_store:
        catch * set_err(error) -> @err_store:
            <div>
                some_commplex_rendering()
    else:
        <div>
            `Error ocurred: ${ @err_store }`
            <button>
                link {click} reset() -> @err_store
                "Retry"

There are few interesting notes:

1. Keep in mind that it may trigger a continuous rerendering
   if the block is not covered by a condition that depends on the action
2. ``reset()`` action might be anything, like retry request to the backend
   or anything
3. If rendering depends on a result of a request, you may retry request at
   some interval and reset store when request is fine

Currently all errors are always caught, but we may add ``instanceof`` check
in the future.

Technically catch works as follows:

1. Error is wrapped into ``SuppressedError`` and propagated down the stack
2. Outer catch statements skip ``SuppressedError``
3. Khufu's rendering function retries rendering starting from the top level,
   but does that only once

The (3) has the following consequences:

1. It avoids flicker comparing to rerendering on next animation frame
2. But since the action is dispatched, next frame will rerender anyway
3. If two errors catched in the same render, user will see flicker anyway
   (we may fix it in future)
4. Render with error might be as much as 3x the normal diffing time, but
   the errors should be relatively rare, so it doesn't matter
5. It's still bad to use exceptions for business-logic errors
   because of (3) and (4). So ``catch`` should be used for fatal errors that
   can't be taken care of in advance.


.. _subviews:

Calling Other Views
===================


The subviews can be called by writing function call::

    view button(x):
      <button>
        x

    view main():
      <div>
        button("a")
        button("b")

Note that for views, only function call syntax is supported not arbitrary
expression. The following will **not** work::

    view main():
      <div>
        button("a") + button("b")

Otherwise you are free to use imported functions both as view and as a regular
functions and they should work as expected.

.. warning:: If you have a function that returns another function and you use
   former in a call expression you will get returned function called
   automatically.  This is the way we use views. The ``view main()`` defined in
   a template is a function that returns a closure. The closure accepts a
   ``key`` as an argument and renders a dom as a side effect (this is how
   incremental-dom_ works). Usually it's not a problem as you never expect
   functions to be rendered as a text node.


.. _placeholders:

Higher Level Views
------------------

Sometimes you want to make a view with a few placeholders, for example::

    view section(){title, body}:
      <secton>
        <h1> title()
        body()

    view main():
      section():
        title: "Hello world"
        body:
          <p> "Some text"
          <p> "Second paragraph"

The example above has the following elements:

* ``{title, body}`` in the ``view`` definition means we need to pass blocks
  with that names when calling a function
* We pass a named blocks by using colon after a function call (``section():``)
  and ``<name>:`` block with either expression or a block after it.

To pass a single block to a function, we can omit colon after a function
call and use a single indented block, like this::

    view main():
      section()
        <p> "Some text"
        <p> "Second paragraph"

Which is equivalent to::

    view main():
      section():
        body:
          <p> "Some text"
          <p> "Second paragraph"

To check if block has been actually passed you can check the block name as
follows::

    view section(){title, body}:
      <secton>
        if title:
          <h1> title()
        body()


The Javascript Parlance
=======================

In many places we allow arbitrary javascript-like expressions. They are mostly
same as javascript but have important differences.

The only thing that is different in expressions is the syntax of boolean
operators: they are replaced with ``and``, ``or``, ``not`` keywords for
readability.  ``not`` operator has lower precedence, it's just above ``and``,
so ``not a == b`` is ``!(a == b)`` and not ``(!a) == b`` like in javascript.

The functionality that is absent in khufu by design:

1. Function declarations
2. All mutation operators, including assignments, augmented assigments,
   increments and ``delete`` operator (but see `let statements`_)
3. Bitwise operators
4. ``new``, ``void``, ``typeof``, ``instanceof``
5. All kinds of Javascript statements (see above for khufu-specific ones)


No Side Effects Rule
====================

It should be the first thing you should know about the khufu language, except
you need to understand the language to read this section. The two rules of
thumb are:

1. Everything evaluated during single render assumed to have no side effects
2. Every function or method call assumed to be pure (i.e. depend only
   on arguments)

In particular:

* Attribute access assumed to be no-op
* Function calls assumed to have no side effects
* Objects passed to function calls are assumed to never mutate
* Store state is assumed to never mutate during render

Side effects are basically allowed in two places
(``MUT_EXPR`` in the examples):

1. The store constructor (``store @name = MUT_EXPR | middleware1``)
2. The action creator expression (``link {ev} MUT_EXPR -> @store_name`` and
   ``catch * MUT_EXPR -> @store_name``)


And the code in both places is assumed to have no influence on other variables
used during render (actually an action creator expression is never
evaluated during template render).

This is important so that khufu can optimize things out. In particular khufu
assumes that it's safe to do the following:

1. Reorder evaluation of any expression. For example,
   ``let x = a() + b()`` may be evaluated as
   ``let b_ = b(), a_ = a(), x = a_ + b_``

2. Evaluate expressions that depend neither on stores nor on function arguments
   only once, at module intitialization. For example::

       import {text} from './btn'
       view render():
            let x = 16
            <input type='button' style={width: x + 'px'} value=text()>

   May be compiled as::

       import {text} from './btn'
       const BUTTON_ATTRIBUTES = ['type', 'text',
                                  'style', {width: '16px'},
                                  'value', text()]
       function render() {
            elementVoid('button', 'x', BUTTON_ATTRIBUTES)
       }

   Note that neither the value of style nor the ``text()`` function are
   evaluated on each call of ``render()``, they are cached in module
   intitialization forever.

3. Cache attribute access. For example::

        <a href=`http://${lnk.host}/${lnk.path}`>
            lnk.host

   Is the same as::

        let host_ = lnk.host
        <a href=`http://${host_}/${lnk.path}`>
            host_


It may look like the rules are too complex. But they are not. Actually they
are rules that most users of any virtual dom library obey anyway. The khufu
is just a library that are going to make use of all of these assumptions
for optimization

.. note:: We do not make most optimizations yet. But they will be applied in
   the future library and are assumed as non breaking with regards to
   backwards compatibility


.. _babel: https://babeljs.io/
.. _incremental-dom: https://github.com/google/incremental-dom
.. _redux: http://redux.js.org/
.. _immutablejs: https://facebook.github.io/immutable-js/
.. _redux-rx: https://github.com/acdlite/redux-rx
.. _redux-saga: https://github.com/yelouafi/redux-saga
.. _react: https://facebook.github.io/react/
