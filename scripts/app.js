(function () {
  var gui = require('nw.gui');
  var win = gui.Window.get();
  var context = null;
  var windowOpened = false;

  var initialize = function () {
    var option = {
      key: "Ctrl+Shift+A",
    };
    var shortcut = new gui.Shortcut(option);
    gui.App.registerGlobalHotKey(shortcut);

    shortcut.on('active', function () {
      if (windowOpened) {
        context.clearRect(0, 0, window.outerWidth, window.outerHeight);
        win.hide();
        windowOpened = false;
      } else {
        win.show();
        clearCanvas();
        windowOpened = true;
      }
    });

    win.setResizable(true);
    win.maximize();
  };

  win.on('maximize', function () {
    windowOpened = true;
    win.setResizable(false);
    win.show();
    // XXX: maximizeイベントのリスナーではウィンドウが最大になりきっていないため、ちょっと後に実行する
    setTimeout(setupCanvas, 300);
  });

  var clearCanvas = function () {
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(0, 0, window.outerWidth, window.outerHeight);
  };

  var setupCanvas = function () {
    var canvas = document.getElementsByTagName('canvas')[0];
    canvas.setAttribute('width', window.outerWidth);
    canvas.setAttribute('height', window.outerHeight);
    context = canvas.getContext('2d');
    clearCanvas(context);

    context.strokeStyle = "#FC0C59";
    context.lineWidth = 10;
    context.lineJoin = "round";
    context.lineCap = "round";

    var drawStreamByMouse = function () {
      var a = Bacon.fromEventTarget(window, 'mousedown')
                   .flatMap(function () {
                     return Bacon.fromEventTarget(canvas, 'mousemove')
                                 .takeUntil(Bacon.fromEventTarget(window, 'mouseup'));
                   })
                   .map(function (e) {
                     return {
                       x: e.clientX,
                       y: e.clientY
                     };
                   });
      var b = Bacon.fromEventTarget(window, 'mouseup')
                   .map(function () {
                     return {
                       x: null,
                       y: null
                     };
                   });
      return a.merge(b);
    };
    var drawStream = drawStreamByMouse();
    drawStream
      .slidingWindow(2, 2)
      .filter(function (points) {
        var a = points[0];
        var b = points[1];
        return (a.x !== null) && (a.y !== null) && (b.x !== null) && (b.y !== null);
      })
      .onValue(function (points) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        context.lineTo(points[1].x, points[1].y);
        context.stroke();
        context.closePath();
      });
  };

  initialize();
})();
