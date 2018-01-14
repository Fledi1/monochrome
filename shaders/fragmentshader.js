module.exports.fragmentshader = `

precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec3 slider_rgb;
uniform bool unedited;
uniform bool color;
// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void contrast(inout float var, float value);
void addBrightness(inout float var, float value);
void multBrightness(inout float var, float value);

void main() {
   vec4 incol = texture2D(u_image, v_texCoord).rgba;
   vec4 col = incol;
   //gl_FragColor = vec4(col.r*val_b,col.b*(1.0-val_b), col.g, col.a);



   //Additive Brightness
   addBrightness(col.r, slider_rgb.b);
   addBrightness(col.g, slider_rgb.b);
   addBrightness(col.b, slider_rgb.b);
   //Multiplicative Brightness
   multBrightness(col.r, slider_rgb.g);
   multBrightness(col.g, slider_rgb.g);
   multBrightness(col.b, slider_rgb.g);
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
   contrast(col.r, slider_rgb.r);
   contrast(col.g, slider_rgb.r);
   contrast(col.b, slider_rgb.r);

   if(!unedited){
     if(!color){
       //Black and white conversion
       float b = 0.0;
       b += col.r * 0.2126;
       b += col.g * 0.7152;
       b += col.b * 0.0722;
       gl_FragColor = vec4(b,b,b,1.0);
     }
     if(color){
       gl_FragColor = col;
     }
   }
   if(unedited){
     gl_FragColor = incol;
   }

}

void contrast(inout float var, float value){
  var = (  ( (259.0 * (value + 255.0)) / (255.0 * (259.0 - value)) ) * ( (var*255.0) - 128.0  ) + 128.0 )/255.0;
}
void addBrightness(inout float var, float value){
  var += value;
}
void multBrightness(inout float var, float value){
  var *= value;
}

`;
