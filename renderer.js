// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var nativeImage = require('electron').nativeImage

const verts = require('./shaders/vertexshader.js');
const frags = require('./shaders/fragmentshader.js');

const fs = require('fs');
const canvasBuffer = require('electron-canvas-to-buffer');

const HistogramCanvas = require('histogram-canvas');

const dcraw = require('dcraw');

const {decode} = require('decode-tiff');
const {PNG} = require('pngjs');

const remote = require('electron').remote;
const dialog = remote.dialog;

var currentImagePath = "image";

let canvas_histogram;
let histogram;
let canvas_colorhistogram;
let colorhistogram;

var unedited = false;
var color = true;

var gl;
var program;

var positionLocation;
var texcoordLocation;
var texcoordBuffer;
var positionBuffer;

var texture;

//Uniform loactions
var resolutionLocation;


var slider_lightnesscontrastLocation;

var slider_regularcontrastLocation;

var slider_multbrightLocation;
var slider_multbright_topLocation;
var slider_multbright_midLocation;
var slider_multbright_botLocation;

var slider_addbrightLocation;

var slider_saturationLocation;
var slider_vibranceLocation;
var slider_sat_contrastLocation;

var slider_hueshiftLocation;

var uneditedLocation;
var colorLocation;

var lastUpdate = 0;
var intervalInMs = 33;

function main(src, filetype) {

  var image = document.createElement('img');

  if(filetype == 'jpgpng'){
    image.src = src;
    image.onload = function() {
      render(image);
    }
  }else if (filetype == 'raw'){
    //https://www.npmjs.com/package/dcraw
    //dcraw Test
    fs.readFile(src, (err,readdata) =>{
      if(err) throw err;
      var imarr = dcraw(readdata, {verbose:true, exportAsTiff:true});
      const {width, height, data} = decode(imarr);
      const png = new PNG({width, height});
      png.data = data;

      var blob = new Blob([PNG.sync.write(png)],{'type': 'image/png'});
      var url = URL.createObjectURL(blob);
      image.src = url;
      image.onload = function() {
        render(image);
      }
    });
  }else if (filetype == 'tiff'){
    let imarr = fs.readFileSync(src);
    const {width, height, data} = decode(imarr);
    const png = new PNG({width, height});
    png.data = data;

    var blob = new Blob([PNG.sync.write(png)],{'type': 'image/png'});
    var url = URL.createObjectURL(blob);
    image.src = url;
    image.onload = function() {
      render(image);
    }
  }
}

function render(image) {


// Get A WebGL context
/** @type {HTMLCanvasElement} */
var canvas = document.getElementById("canvas");
canvas.width = image.width;
canvas.height = image.height;

gl = canvas.getContext("webgl", {
  preserveDrawingBuffer: false,
  antialias: true
});
if (!gl) {
  return;
}

// setup GLSL program
//Vertex Shader
var vertexshader_code = verts.vertexshader;
var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertexshader_code);
gl.compileShader(vertShader);

//Fragment shader
var fragmentshader_code = frags.fragmentshader;
var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader,fragmentshader_code);
gl.compileShader(fragShader);

program = gl.createProgram();
gl.attachShader(program, vertShader);
gl.attachShader(program, fragShader);
gl.linkProgram(program);

// look up where the vertex data needs to go.
positionLocation = gl.getAttribLocation(program, "a_position");
texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

// Create a buffer to put three 2d clip space points in
positionBuffer = gl.createBuffer();

// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// Set a rectangle the same size as the image.
setRectangle(gl, 0, 0, image.width, image.height);

// provide texture coordinates for the rectangle.
texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0,
]), gl.STATIC_DRAW);

// Create a texture.
texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// Set the parameters so we can render any size image.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

// Upload the image into the texture.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

// lookup uniforms
resolutionLocation = gl.getUniformLocation(program, "u_resolution");

slider_lightnesscontrastLocation = gl.getUniformLocation(program, "value_lightnesscontrast");
slider_regularcontrastLocation = gl.getUniformLocation(program, "value_regularcontrast");
slider_multbrightLocation = gl.getUniformLocation(program, "value_multbright");
slider_multbright_topLocation = gl.getUniformLocation(program, "value_multbright_top");
slider_multbright_midLocation = gl.getUniformLocation(program, "value_multbright_mid");
slider_multbright_botLocation = gl.getUniformLocation(program, "value_multbright_bot");

slider_addbrightLocation = gl.getUniformLocation(program, "value_addbright");

slider_vibranceLocation = gl.getUniformLocation(program, "value_vibrance");
slider_saturationLocation = gl.getUniformLocation(program, "value_saturation");
slider_sat_contrastLocation = gl.getUniformLocation(program, "value_sat_contrast");

slider_hueshiftLocation = gl.getUniformLocation(program, "value_hueshift");

uneditedLocation = gl.getUniformLocation(program, "unedited");
colorLocation = gl.getUniformLocation(program, "color");

//webglUtils.resizeCanvasToDisplaySize(gl.canvas);

// Tell WebGL how to convert from clip space to pixels
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  updateImage(true);
}

function updateImage(askTime){

  //Limit how often this runs
  var now = Date.now();
  //If last update was too recent
  if(lastUpdate + intervalInMs > now && askTime == true)  return;
  //else
  lastUpdate = now;

  //If gl is not defined, don't try to access it
  if(!gl)
    return;

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset)

  // Turn on the teccord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset)

  // set uniforms
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  gl.uniform1f(slider_lightnesscontrastLocation, document.getElementById('slider_lightnesscontrast').getAttribute('value'));
  gl.uniform1f(slider_regularcontrastLocation, document.getElementById('slider_regularcontrast').getAttribute('value'));
  gl.uniform1f(slider_multbrightLocation, document.getElementById('slider_multbright').getAttribute('value'));
  gl.uniform1f(slider_multbright_topLocation, document.getElementById('slider_multbright_top').getAttribute('value'));
  gl.uniform1f(slider_multbright_midLocation, document.getElementById('slider_multbright_mid').getAttribute('value'));
  gl.uniform1f(slider_multbright_botLocation, document.getElementById('slider_multbright_bot').getAttribute('value'));

  gl.uniform1f(slider_addbrightLocation, document.getElementById('slider_addbright').getAttribute('value'));

  gl.uniform1f(slider_vibranceLocation, document.getElementById('slider_vibrance').getAttribute('value'));
  gl.uniform1f(slider_saturationLocation, document.getElementById('slider_saturation').getAttribute('value'));
  gl.uniform1f(slider_sat_contrastLocation, document.getElementById('slider_sat_contrast').getAttribute('value'));

  gl.uniform1f(slider_hueshiftLocation, document.getElementById('slider_hueshift').getAttribute('value'));

  gl.uniform1f(uneditedLocation, unedited);
  gl.uniform1f(colorLocation, color);


  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);

  //Update Histogram
  updateHistogram();
}

  function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

function updateHistogram(){

  let hist = new Uint8Array(256);
  let colhist = new Uint8Array(360);

  for (var i = 0; i < 360; i++) {
    if(i < 256){hist[i] = 0}
    colhist[i] = 0;
  }

  //let imageData = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  //gl.readPixels(0,0,gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

  //let imageData = _ctx.getImageData(0,0,_canvas.width,_canvas.height).data;
  let stepSize = Math.floor((gl.drawingBufferWidth*gl.drawingBufferHeight)/512);
  console.log(stepSize);
  for (var i = 0; i < gl.drawingBufferWidth*gl.drawingBufferHeight; i += stepSize) {
    let pixel = new Uint8Array(4);
    gl.readPixels(i%gl.drawingBufferWidth,Math.floor(i/gl.drawingBufferWidth),1,1,gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    let red = pixel[0];
    let green = pixel[1];
    let blue = pixel[2];
    //hist[Math.max(imageData[i],imageData[i+1],imageData[i+2])]++;
    //hist[Math.round((imageData[i]+imageData[i+1]+imageData[i+2])/3)]++;
    hist[Math.round((red+green+blue)/3)]++;

    let hue = 0;

    // let cmax = Math.max(imageData[i],imageData[i+1],imageData[i+2]);
    // let delta = cmax - Math.min(imageData[i],imageData[i+1],imageData[i+2]);
    //
    // //Hue
    // if(delta == 0.0){
    //   hue = 0.0;
    // }else if (cmax == imageData[i]){
    //   hue = 60.0 * (((imageData[i+1]-imageData[i+2])/delta)%6.0);
    // }else if (cmax == imageData[i+1]){
    //   hue = 60.0 * ((imageData[i+2]-imageData[i])/delta+2.0);
    // }else if (cmax == imageData[i+2]){
    //   hue = 60.0 * ((imageData[i]-imageData[i+1])/delta+4.0);
    // }
    let cmax = Math.max(red,green,blue);
    let delta = cmax - Math.min(red,green,blue);

    //Hue
    if(delta == 0.0){
      hue = 0.0;
    }else if (cmax == red){
      hue = 60.0 * (((green-blue)/delta)%6.0);
    }else if (cmax == green){
      hue = 60.0 * ((blue-red)/delta+2.0);
    }else if (cmax == blue){
      hue = 60.0 * ((red-green)/delta+4.0);
    }
    colhist[hue]++;
  }
  //smooth Histogram
  for(let j = 0; j < 1; j++){
    for(let i = 1; i < colhist.length-1; i++){
      if(i < hist.length-1){
        hist[i] = Math.round((hist[i-1]+hist[i]+hist[i+1])/3);
      }
      colhist[i] = Math.round((colhist[i-1]+colhist[i]+colhist[i+1])/3);
    }
  }

  //console.log(imageData);
  //console.log(colhist)

  let data = {red:Array.from(hist),green:[0],blue:[0]};
  let coldata = {red:Array.from(colhist),green:[0],blue:[0]}
  histogram.update(data);
  colorhistogram.update(coldata);
}

function initHistogram(){
  canvas_histogram = document.getElementById('canvas_histogram');
  canvas_colorhistogram = document.getElementById('canvas_colorhistogram');

  histogram = new HistogramCanvas(canvas_histogram,{green:false,blue:false,redColor:'#FFFFFF'});
  colorhistogram = new HistogramCanvas(canvas_colorhistogram,{green:false,blue:false,redColor:'#FFFFFF'});

  let data = {red:[1,1,1],green:[0],blue:[0]};
  histogram.update(data);
  colorhistogram.update(data);
}

module.exports.initHistogram = function(){
  initHistogram();
}

module.exports.openImageDialog = function(filetype){
  console.log("should open " + filetype + " file");
  let pathToOpen = dialog.showOpenDialog({properties: ['openFile']});
  currentImagePath = pathToOpen[0];
  main(pathToOpen[0], filetype);
}

module.exports.saveImageDialog = function(filetype){
  console.log("should save as " + filetype);
  console.log(currentImagePath);
  let newName = currentImagePath.substring(currentImagePath.lastIndexOf('/')+1,currentImagePath.lastIndexOf('.'));
  newName += '.' + filetype;
  console.log(newName);
  let path = dialog.showSaveDialog({title: "Save Image", defaultPath: newName});

  let buffer;
  if(filetype =='png'){
    buffer = canvasBuffer(document.getElementById('canvas'), 'image/png');
  }else if(filetype =='jpg'){
    buffer = canvasBuffer(document.getElementById('canvas'), 'image/jpeg');
  }

  fs.writeFile(path, buffer, {flag: 'w'}, function(err){
    throw err;
  });
}

module.exports.setUnedited = function(value){
  unedited = value;
}

module.exports.setColor = function(value){
  color = value;
}

module.exports.updateImage = function(askTime){
  updateImage(askTime);
}
