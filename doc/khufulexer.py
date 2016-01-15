from pygments.lexer import RegexLexer, words
from pygments.token import *

KEYWORDS = [
    'store', 'link', 'view', 'style',
    'import', 'from', 'for', 'of',
    'if', 'elif', 'else',
]


class KhufuLexer(RegexLexer):
    name = 'Khufu'
    aliases = ['khufu']
    filenames = ['*.khufu']

    tokens = {
        'root': [
            (words(KEYWORDS, suffix=r'\b'), Keyword),
            (r'//.*\n', Comment),
            (r'"[^"]*"', String),
            (r'@[a-zA-Z_0-9]+', Name.Builtin),
            (r'<[a-zA-Z_0-9]+', Name.Tag, 'tag'),
            (r'.', Text),
        ],
        'tag': [
            (r'@[a-zA-Z_0-9]+', Name.Builtin),
            (r'>', Name.Tag, '#pop'),
            (r'.', Text),
        ],
    }
