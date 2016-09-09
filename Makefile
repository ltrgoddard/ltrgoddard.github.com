all: Louis_Goddard_CV.pdf cv.html
	git add cv.markdown Louis_Goddard_CV.pdf cv.html
	git commit -m "cv update"
	git push

Louis_Goddard_CV.pdf: cv.markdown
	pandoc -Ss cv.markdown -o Louis_Goddard_CV.pdf -V geometry:margin=1.25in

cv.html: cv.markdown
	pandoc -Ss cv.markdown -o cv.html --css=cv.css
