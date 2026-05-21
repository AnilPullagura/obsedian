ui front end 
first spearate this two folders move all backend to server folder and ui to client folder
ui stack 
react 
every component should use this strictly :
functional components with hooks and rounting use link 
evrey componets should have this state if needed 
hooks for apis if need 
must return jsx 
use extrenal css only no inline and tailwind style not prefered

use component pattern and moduler folder structure to isolate home folder cart folder 
in home folder all products are create from product item folders so like this break big componets to chunks with corrosponding components and folder
do not put all the code in a single file 
for apis use fetch not axios
use cookies via httponly to set automatically

use proper try catch blocks 
use css media queris for desktop and mobile and flexbox use over grid
only hover animations over keyframes

use conditional rendering acording to api status like loader faiure screen and succes screen

do not put eventhandle callbacks at jsx syntax inlinely use a method to all that call backs only jsx realted atributes are allowd on jsx block

write code as like fresher with comforatable react cnadidate not like highend ai system 

ok do one thing i write jsx one by one you just call api and take send data and parse it store in state i control ui u do heavy lifting 