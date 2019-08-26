var Jimp = require('jimp');
const request = require('request');

var sura = 5;
var ayah = 50;
//if you are following along, create the following 2 images relative to this script:
let imgRaw = 'raw/image3.jpg'; //a 1024px x 1024px backgroound image
let imgLogo = `http://www.everyayah.com/data/images_png/${sura}_${ayah}.png`; //a 155px x 72px logo
//---

let imgActive = 'active/temp.jpg';
let imgExported = 'export/image2.jpg';






request(`http://api.alquran.cloud/v1/ayah/${sura}:${ayah}/en.sahih`, { json: true,strictSSL: false }, (err, res, body) => {
  if (err) { return console.log(err); }
  console.log(body.data.text);

  let textData = {
    text: body.data.text, //the text to be rendered on the image
    maxWidth: 1024 - 10, //image width - 10px margin left - 10px margin right
    maxHeight: 90 + 20, //logo height + margin
    placementX: 1024 / 2 + 100, // 10px in on the x axis
    placementY: 1024 + 50 //bottom of the image: height - maxHeight - margin 
  };
  

  //read template & clone raw image 
  Jimp.read(imgRaw)
    .then(tpl => (tpl.clone().write(imgActive)))

    //read cloned (active) image
    .then(() => (Jimp.read(imgActive)))
    //combine logo into image
    .then(tpl => (      
      Jimp.read(imgLogo).then(logoTpl => {
        logoTpl.opacity(0.9);
        logoTpl.invert();
        logoTpl.scale(2);
        var xsrc = logoTpl.bitmap.width;
        var ysrc = logoTpl.bitmap.height;
        textData.placementY = 512 + ysrc;
        tpl.resize(2400,Jimp.AUTO);
        return tpl.composite(logoTpl, 1024 - xsrc/2 , 512, [Jimp.BLEND_SOURCE_OVER, 0.2, 0.2]);
      }))
    )

    //load font	
    .then(tpl => (
      Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(font => ([tpl, font]))
    ))

    //add footer text
    .then(data => {

      tpl = data[0];
      font = data[1];

      return tpl.print(font, textData.placementX, textData.placementY, {
        text: textData.text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, textData.maxWidth, textData.maxHeight);
    })

    //export image
    .then(tpl => (tpl.quality(100).write(imgExported)))

    //log exported filename
    .then(tpl => {
      console.log('exported file: ' + imgExported);
    })

    //catch errors
    .catch(err => {
      console.error(err);
    });


});

