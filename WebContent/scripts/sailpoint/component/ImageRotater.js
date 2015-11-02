SailPoint.ImageRotater = Class.create();
SailPoint.ImageRotater.prototype = {
  
  ieFix : null,
  angle : null,
  tmp : null,
  img : null,
  newImg : null,
  canvas : null,
  
  initialize: function(img) {
    this.ieFix = img;
    this.img = img;
    this.angle = 0;
    src = img.src;
    this.tmp = document.createElement('span');
    
    img.parentNode.insertBefore(this.tmp, img);
    this.newImg = new Image();
    this.newImg.src = src;
    this.newImg.ref = this;
  },
  
  
  rotate : function (angle) {
    if (!angle && !this.angle) return;
    if(!this.angle && angle) {
      this.angle = (angle%360)*Math.PI / 180;
    }
    this.ieFix.parentNode.removeChild(this.ieFix);
    var width = this.newImg.width;
    var height = this.newImg.height;
    this.newImg.widthMax=this.newImg.heightMax=Math.sqrt((height)*(height) + (width) * (width));

    this.canvas=document.createElement('canvas');
    this.canvas.ref=this;
    this.canvas.id = this.img.id;
    this.canvas.height=width;
    this.canvas.width=height;
    this.canvas.style.left = this.img.style.left;
    this.canvas.style.top = this.img.style.top;
    this.canvas.className = this.img.className;
  
    this.canvas.setAttribute('width',width);  
    this.tmp.appendChild(this.canvas);
    
    if(Ext.isIE) {
      G_vmlCanvasManager.initElement(this.canvas);
      this.canvas=document.getElementById(this.canvas.id);
      this.canvas.ref=this;
    }
    this.canvas.className = this.img.className;
    this.cnv = this.canvas.getContext('2d');
    this.cnv.save();
    //this.cnv.translate(widthAdd/2,heightAdd/2); // at least center image on screen
    this.cnv.translate(width/2,height/2);      // we move image back to its orginal 
    this.cnv.rotate(this.angle);            // rotate image
    this.cnv.translate(-width/2,-height/2);    // move image to its center, so we can rotate around its center
    this.cnv.drawImage(this.img, 0, 0);     // First - we draw image
    this.cnv.restore();
  
  },
  
  rotatePoints : function (startX, endX, startY, endY) {   
    this.angle = Math.atan2(endY-startY, endX-startX);
    this.rotate();
  }
   
};