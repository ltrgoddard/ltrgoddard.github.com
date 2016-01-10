#!/bin/bash

cd /home/ubuntu/ltrgoddard.github.com
inotifywait -m -q -e moved_to --format %f /home/ubuntu/Dropbox/PhD/Markdown/ | while IFS= read -r file; do
  filename=$(basename "$file")
  extension="${filename##*.}"
  filename="${filename%.*}"
  path="/home/ubuntu/Dropbox/PhD"
  pandoc "$path"/Markdown/"$filename".md -s -c basic.css -o /var/www/html/"$filename".html --smart
  pandoc "$path"/Markdown/"$filename".md -s -o "$path"/PDF/"$filename".pdf
  if [ "$filename"=="cv" ]
  then
    git pull
    pandoc "$path"/Markdown/cv.md -s -c cv.css -o /home/ubuntu/ltrgoddard.github.com/index.html --smart
    git add index.html
    cp "$path"/PDF/cv.pdf /home/ubuntu/ltrgoddard.github.com/Louis_Goddard_CV.pdf
    git add Louis_Goddard_CV.pdf
    git commit -m "Automatic CV update."
    git push
  fi
done
