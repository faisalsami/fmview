# fmview

FM View generates the Concept Map for VistA Fileman files among packages. It also generates dependency chart tree to show the in and out pointers of a particualr Fileman File by double clicking any files. User can focus on particular file or package in the concept map diagram by just click once, and click again to go back to concept map.

Currently the Concept Map is generated only for VistA FOIA OSEHRA release.

It requires a Vista server along with ewdjs configured. For further details visit [http://ewdjs.com](http://ewdjs.com/)

Please visit one of the following url for a live version running on OSEHRA Vista release. 

####Amazon 
[http://ec2-54-172-186-142.compute-1.amazonaws.com:8080/ewd/fmview/index.html](http://ec2-54-172-186-142.compute-1.amazonaws.com:8080/ewd/fmview/index.html)

####Google cloud 
[http://104.197.41.218:8080/ewd/fmview/index.html](http://104.197.41.218:8080/ewd/fmview/index.html)

##Setup Instructions:

1) Move to ewd directory in your ewdjs setup e.g. /home/youruser/ewdjs/www/ewd/

2) Do git clone https://github.com/faisalsami/fmview.git

3) Copy the fmview.js to your node_modules folder at ewdjs parent directory.