all: Louis_Goddard_CV.pdf cv.html
	git add cv.markdown Louis_Goddard_CV.pdf cv.html
	git commit -m "cv update"
	git push

Louis_Goddard_CV.pdf: cv.markdown
	pandoc -s cv.markdown -o Louis_Goddard_CV.pdf -V geometry:margin=1.25in

cv.html: cv.markdown
	pandoc -s cv.markdown -o cv.html --css=cv.css

index.html: bio.markdown simple.css
	pandoc -s bio.markdown -o index.html --metadata title="Louis Goddard" --css=simple.css
