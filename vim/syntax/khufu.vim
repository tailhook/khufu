" Vim syntax file
" Language: Khufu
" Maintainer:Paul Colomiets

if exists("b:current_syntax")
  finish
endif

syn keyword khufuToplevels view style import from
syn keyword khufuFlow if elif else for in of key
syn keyword khufuOperator and or not
syn keyword khufuSpecial store link let
syn match khufuComment "//.*$" contains=khufuTodo
syn region khufuString start='"' end='"'
syn region khufuString start="'" end="'"
syn region khufuTag start="<" end=">" contains=khufuTagName,khufuAttr,khufuString,khufuStore
syn match khufuTagName contained "<[a-zA-Z0-9-]\+"ms=s+1
syn match khufuAttr contained "[a-z-]\+="me=e-1
syn match khufuStore "@[a-zA-Z_][a-zA-Z0-9_]*"

hi def link khufuToplevels PreProc
hi def link khufuFlow Statement
hi def link khufuComment Comment
hi def link khufuString String
hi def link khufuOperator Operator
hi def khufuTagName term=bold cterm=bold gui=bold
hi def link khufuAttr String
hi def link khufuSpecial Identifier
hi def link khufuStore Identifier
