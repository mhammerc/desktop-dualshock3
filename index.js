/* Created by Martin Hammerchmidt.
 * This is in public domain.
 * This software based on Node.js let you control your Desktop (prefer linux) directly
 * from your Dualshock 3.
 * 
 * Left stick : move mouse
 * Right stick : scroll (only down or up)
 * x : one left mouse click
 * square : Toggle left mouse click
 * circle : one right mouse click
 * r1 : press enter on keyboard
 * r2 : activate or dismiss virtual keyboard (work natively on ubuntu based distribution,
 * else you have to install onboard (linux))
 * up, down, left, right : press corresponding arrow on keybaord
 *
 * You need Node.js 0.10.x to use this software. Will not work on new Node.js version.
 * This software still really simple and can be improved by many ways, even turned in
 * true graphical software.
 */

/* CONFIGURATIONS */

var mouseSensibility = 16; /* Sensibility of the mouse */
var scrollSensibility = 2; /* Scrolling speed */

/* CODE START HERE */

var process = require('child_process');

var _ = require('underscore');

var Cylon = require('cylon');
var robot = require('robotjs');

var deltaMouseMove = { x: 0, y: 0 };
var deltaMouseScroll = { y: 0, up: false };

var keyboardButton = { up: false, left: false, right: false, down: false, r1: false };
var keyboardButtonToggle = false;

var virtualKeyboard = { enabled: false, process: null }; // Virtual keyboard work better on ubuntu
// or you need to install onboard (linux).

Cylon.robot({
  connections: {
    joystick: { adaptor: 'joystick' }
  },

  devices: {
    controller: { driver: 'dualshock-3' }
  },

  work: function(my) 
  {
    my.controller.on('x' + ':press', function()
    {
      robot.mouseClick('left');
    });

    my.controller.on('circle' + ':press', function()
    {
      robot.mouseClick('right');
    });

    my.controller.on('square' + ':press', function()
    {
      robot.mouseToggle('down', 'left');
    });

    my.controller.on('square' + ':release', function()
    {
      robot.mouseToggle('up', 'left');
    });

    ['up', 'down', 'left', 'right', 'r1'].forEach(function(button) 
    {
      my.controller.on(button + ':press', function() 
      {
        keyboardButton[button] = true;
        keyboardButtonToggle = true;
      });

      my.controller.on(button + ':release', function() 
      {
        keyboardButton[button] = false;
        keyboardButtonToggle = true;
      });
    });

    my.controller.on('r2:press', function()
    {
      if(virtualKeyboard.enabled == false)
      {
        virtualKeyboard.process = process.spawn('onboard');
        virtualKeyboard.enabled = true;
      } else
      {
        virtualKeyboard.process.kill();
        virtualKeyboard.enabled = false;
      }
    });

    my.controller.on('left_x:move', function(delta) 
    {
      delta.toFixed(1);
      delta *= mouseSensibility;

      if(delta > -1.4 && delta < 1.4)
        delta = 0;

      deltaMouseMove.x = delta;
    });

    my.controller.on('left_y:move', function(delta) 
    {
      delta.toFixed(1);
      delta *= mouseSensibility;

      if(delta > -1.4 && delta < 1.4)
        delta = 0;

      deltaMouseMove.y = delta;
    });

    my.controller.on('right_y:move', function(delta)
    {
      delta.toFixed(1);
      delta *= scrollSensibility;

      if(delta > -0.1 && delta < 0.1)
        delta = 0;

      if(delta < 0)
      {
        delta *= -1;
        deltaMouseScroll.up = true;
      }
      else
      {
        deltaMouseScroll.up = false;
      }

      deltaMouseScroll.y = delta;
    });
  }
});

setInterval(function()
{
  var mouse = robot.getMousePos();
  robot.moveMouse(mouse.x + deltaMouseMove.x, mouse.y + deltaMouseMove.y);

  robot.scrollMouse(deltaMouseScroll.y, deltaMouseScroll.up ? 'up' : 'down');

  if(keyboardButtonToggle)
  {
    _.each(keyboardButton, function(value, key)
    {
      robot.keyToggle(key == 'r1' ? 'enter' : key, value ? 'down' : 'up');
    });

    keyboardButtonToggle = false;
  }
}); // Delay not specified because to move mouse we need really high refresh rate.



Cylon.start();