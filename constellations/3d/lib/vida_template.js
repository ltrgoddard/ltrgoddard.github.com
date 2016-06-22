$(document).ready(function() {
  // read manifest
  $.getJSON('manifest.json', function(manifest) {
    window.config = {};
    var properties = manifest.properties;
    properties.forEach(function(p) {
      window.config[p.name] = p.value;
    });
    
    // load HTML and append to body canvas
    var document_css = manifest.stylesheet[0]
      
      function run() {
        // load CSS
        var css = $('<link rel="stylesheet" type="text/css" href="' + document_css + '" />');
        $('body').append(css);

        // load Javascript
        for (var i = 0; i < manifest.javascript.length; i++) {
          var js = manifest.javascript[i]
          var script = $('<script type="text/javascript" src="' + js +'"></script>');
          $('body').append(script);
        }
      }
      
      run();
  });
});
