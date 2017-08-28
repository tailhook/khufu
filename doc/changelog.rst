========================
Khufu Changes By Release
========================

.. _changelog 0.5.0:

v0.5.0
======

.. admonition:: Upgrading
   :class: hint

   1. If you have the variables that clash with store names, they must be
      renamed, (see below).
   2. The variables named ``catch`` are prohibited now
   3. API: use ``import {attach} from 'khufu-runtime'`` instead of
      importing default


* Added :ref:`if-let <if-let>` statement
* ``catch`` became reserved word, added :ref:`catch <catch>` statement
* Imports that shadow builtin names like ``text`` and ``item`` are now handled
  properly
* Simplified object literals like ``{field1, field2}`` are supported
* Stores are now in the same namespace as normal variables, so ``x`` is
  a store and ``@x`` is a ``x.getState()`` (but with optimizations applied).
  So the store can be passed as a variable normally as well as you can access
  any extra methods on the store without any hacks.
* Now we allow ``@x`` as assignment target everywhere (i.e. even in let
  statements or object/array unpacking, etc..). The AT sign in assignment
  context basically just an indicator that you will use the variable as a
  store, without any special meaning.
* The default-exported function in ``khufu-runtime`` module is now gone, and
  is replaced by ``attach`` function that works the same. This is because
  exporting both the default and named variables is not recommended at least by
  rollup.
