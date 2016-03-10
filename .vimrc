set undolevels=0
set nojoinspaces
syntax enable
set background=light
autocmd BufNewFile,BufRead *.markdown syntax off|set linebreak|set display+=lastline|set foldcolumn=2|setlocal noautoindent|setlocal nocindent|setlocal nosmartindent|setlocal indentexpr=|nnoremap j gj|nnoremap k gk
filetype plugin indent on
" show existing tab with 4 spaces width
set tabstop=4
" when indenting with '>', use 4 spaces width
set shiftwidth=4
" On pressing tab, insert 4 spaces
set expandtab
