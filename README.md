## About

A simple node.js based web app (written in CoffeeScript) to stream video with HTML5.
Uses backbone.js, jQuery and HTML5 Boilerplate components for the front-end.

This was written to easily stream my video library to my iPad from my media server.
It should work with other mobile devices, however it hasn't been tested and might 
require some interface tweaks.

## Requires

* Node.js 0.4+
(Modules: Express / Stylus / Coffee-script)

## Setup

* 'npm install' modules
* Edit config/config.json to point to media sources
* coffee app.coffee

## Limitations

* Currently only works with h.264 video - See link below for supported browsers
* Tested with Safari 5.1, Mobile Safari (iPad 4.3.5)and Google Chrome 14
* Android versions before 2.3 have issues with HTML5 video (see link below)
* Relies on video controls attribute for controls

## Known Issues

* Node.js 0.5.5+ required to stream files over 2GB
* Google Chrome won't play files over 2GB (Chronium 95805)
* iOS won't auto-play videos until you have manually started one 

## References

http://diveintohtml5.org/video.html
http://stackoverflow.com/questions/3768529/html5-video-seeking-on-ipad

http://jashkenas.github.com/coffee-script/
http://documentcloud.github.com/backbone/
http://api.jquery.com/category/plugins/templates/
http://html5boilerplate.com/

## License 
Copyright (c) 2011 Brad Harrell

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
