module.exports.fragmentshader = `

precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec3 slider_rgb;
uniform bool unedited;
// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
   vec4 col = texture2D(u_image, v_texCoord).rgba;
   //gl_FragColor = vec4(col.r*val_b,col.b*(1.0-val_b), col.g, col.a);

   //Black and white conversion
   float b = 0.0;
   b += col.r * 0.2126;
   b += col.g * 0.7152;
   b += col.b * 0.0722;
   //Additive Brightness
   b += slider_rgb.b;
   //Multiplicative Brightness
   b *= slider_rgb.g;
   //Multiplicative Contrast
   // if(b<0.5){
   //   b *= (1.0-slider_rgb.r);
   // }else{
   //   b *= (1.0+slider_rgb.r);
   // }
   //Additive Contrast
   // if(b<0.5){
   //   b -= slider_rgb.r;
   // }else{
   //   b += slider_rgb.r;
   // }
   //Propper Contrast
   b = (  ( (259.0 * (slider_rgb.r + 255.0)) / (255.0 * (259.0 - slider_rgb.r)) ) * ( (b*255.0) - 128.0  ) + 128.0 )/255.0;
   if(!unedited){
     gl_FragColor = vec4(b,b,b,1.0);
   }
   if(unedited){
     gl_FragColor = col;
   }
}

`;
