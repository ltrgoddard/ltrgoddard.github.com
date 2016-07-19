for f in *.doc
do
  unoconv --stdout -f html "$f" | pandoc -f html -t markdown -o "$f".markdown
done
