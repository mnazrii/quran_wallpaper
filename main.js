var Jimp = require('jimp');
var fs = require('fs');
const request = require('request');

// idx = 20;
// looper(idx);
// function looper(x) { //LOOP
//   if(x==0) return;  
// console.log(x);

var sura;
var ayah;

//generate random quran ayat index = total ayat 6236
var qindex = getRandomInt(6236);

//input background image - set random file
let imgRaw; 
//---

//temp file for processing
let imgActive = 'active/temp.jpg';

//generated image file name
let imgExported = `export/${makeid(5)}.jpg`;

//get random input background 
fs.readdir("raw", function(err, items) {
  var index = getRandomInt(items.length-1);
  console.log(items[index]);

  //input background image - set random file
  imgRaw = `raw/${items[index]}`; 
});


//request to quran api. get ayat
request(`http://api.alquran.cloud/v1/ayah/${qindex}/en.sahih`, { json: true,strictSSL: false }, (err, res, body) => {
  if (err) { return console.log(err); }


  //get ayat surah and number
  console.log(body.data.text);
  console.log(body.data.numberInSurah);
  console.log(body.data.surah.number);
  ayah = body.data.numberInSurah;
  sura = body.data.surah.number;

  //load ayat image from everyayah.com use back info from quran api
  let imgLogo = `http://www.everyayah.com/data/images_png/${sura}_${ayah}.png`; //a 155px x 72px logo

  //write translation
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


// x = x-1;
// looper(x);
// }//end LOOP

//Generate random int
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//generate random text
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


