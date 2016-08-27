all: Louis_Goddard_CV.pdf cv.html

Louis_Goddard_CV.pdf: cv.markdown
	pandoc -Ss cv.markdown -o Louis_Goddard_CV.pdf

cv.html:
	pandoc -Ss cv.markdown -o cv.html --css=cv.css
