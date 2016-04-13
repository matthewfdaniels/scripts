const fs = require("fs");
const async = require("async");
const request = require("request");
const jsdom = require("jsdom").jsdom;
const fountain = require('fountain-js');
const cheerio = require('cheerio');
const util = require("util");
const moment = require("moment");
const exec = require('child_process').exec;
//const movieObj = require(`${__dirname}/../../data/js/movieObj`);
const movieObj = require(`./movieObj`);
  

var startTime = moment();

var downloadedScrapeIds = [];
var pendingScrapeIds = [];

var failedDownloads = [];
var newFails = "scrape_id\n";

var html_paths = {
  "http://www.imsdb.com": {
    path: "#mainbody > table:nth-child(3) > tbody > tr > td:nth-child(3) > table > tbody > tr > td > pre"
  }, 
  "http://www.lynchnet.com": {
    path: "body > pre"
  },
  "http://www.pages.drexel.edu/~ina22/splaylib": {
    path: "body > x-claris-window > x-claris-tagview > pre"
  },
  "http://leonscripts.": {
    path: "body > pre"
  },
  "http://www.aellea.com": {
    path: "body > pre"
  }, 
  "http://www.dailyscript.com": {
    path: "body > pre > blockquote > blockquote"
  }, 
  "http://www.horrorlair.com": {
    path: "body > div.Section1"
  },
  "http://www.pages.drexel.edu": {
    path: "body > x-claris-window > x-claris-remotesave > x-claris-tagview > pre"
  }, 
  "http://www.scifiscripts.com": {
    path: "body > pre > font"
  }, 
  "http://www.theneitherworld.com": {
    path: "body > pre"
  }
};

function cleanURL(url) {

  if(url.startsWith("http://www.imsdb.com/Movie Scripts/")){
    url = url.replace("http://www.imsdb.com/Movie Scripts/", "http://www.imsdb.com/scripts/");
    url = `${url.slice(0, -12).replace(/ /g, "-")}.html`;
    url = url.replace("-.html", ".html");
  }

  if(url.startsWith("http://www.sellingyourscreenplay.com/script-library/")){
    url = `${url}.html`;
  }

  url = url.replace("www.awesomefilm.comscript", "www.awesomefilm.com/script")

  return url;
}

async.series({
// getFailedDownloadList: (cb) => {


//   fs.readFile(`${__dirname}/../../data/tsv/failed-downloads.tsv`, "utf8", (err, data) => {

//     var rows = data.split("\n").slice(1);
//     async.forEachSeries(rows, (row, cb1) => {

//       if(row.length > 0){
//         var parts = row.split("\t");
//         if(failedDownloads.indexOf(parts[0].toString()) === -1){
//            failedDownloads.push(parts[0].toString());
//         }
       
//       }
//       async.setImmediate(() => { cb1(); });
//     }, () => {
//       console.log(`Failed downloads:\t\t${failedDownloads.length}`)

//       cb();
//     })

//   });  
// },
getListOfDownloadedScripts: (cb) => {
  
  var folders = ["pdf", "text"];

  async.forEachSeries(folders, (folder, cb1) => {
    var downloadDir = `${__dirname}/../../data/script_downloads/${folder}/`;

      fs.readdir(downloadDir, (err, files) => {

        async.forEachSeries(files, (file, cb2) => {

          var scrape_id = file.replace("scrape-", "")
                            .replace(".pdf", "")
                            .replace(".txt", "");

          if(downloadedScrapeIds.indexOf(scrape_id.toString()) === -1) {
            downloadedScrapeIds.push(scrape_id.toString());
          }
          async.setImmediate(() => { cb2(); });

        }, () => {
          async.setImmediate(() => { cb1(); });

        });
      });

  }, () => {

    async.forEachSeries(Object.keys(movieObj), (scrape_id, cb1) => {

      if(downloadedScrapeIds.indexOf(scrape_id.toString()) === -1 &&
        pendingScrapeIds.indexOf(scrape_id.toString()) === -1 &&
        failedDownloads.indexOf(scrape_id.toString()) === -1){

        pendingScrapeIds.push(scrape_id.toString())
      } 
      async.setImmediate(() => { cb1() });

    }, () => {
      console.log(`Total URLS (removing ignore):\t${downloadedScrapeIds.length + pendingScrapeIds.length}`)
      console.log(`Downloaded scripts:\t\t${downloadedScrapeIds.length}`)
      console.log(`Pending (nonfailed) scripts:\t${pendingScrapeIds.length}`)
      cb();
    })
  });   
},    
iterateMovies: (cb) => {
  
  var index = 1;

//   pendingScrapeIds = [2155, 3334, 3421, 3423, 3436, 4628, 4629, 5237, 6363, 6419, 6914, 7390, 7470, 7532, 7569, 7619, 8047, 8638, 8652, 8833];

  
  async.forEachSeries(pendingScrapeIds, (scrape_id, cb1) => {
    
    scrape_id = scrape_id.toString();

    var movie = movieObj[scrape_id];

    console.log("\n------------------")
    console.log(`${index}/${pendingScrapeIds.length}`)
    console.log(`Scrape id:\t${scrape_id}`)
    console.log(movie)
    // if(downloadedScrapeIds.indexOf(scrape_id) !== -1 ||
    //   failedDownloads.indexOf(scrape_id) !== -1){
    //   console.log("EXISTS")
    //   async.setImmediate(() => { cb1(); })

    // } else 
    if(typeof movie === "undefined"){
      console.log("IGNORE")
      async.setImmediate(() => { cb1(); })
    } else {
     
      //console.log(movieObj)
      var url = cleanURL(movie.link);

      console.log(url);
      console.log(movie.source)
      index++;

      if (movie.source === "imsdb") {
        fs.readFile(`${__dirname}/../data/${movie.link}`, "utf8", (err, data) => {
          if(err){
            async.setImmediate(() => { cb1(); });
          } else {
            var $ = cheerio.load(data); 
            var selector = html_paths["http://www.imsdb.com"].path;

            console.log($(selector).length)
            if($(selector).length > 0){
              fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $(selector).text());
            }
            async.setImmediate(() => { cb1(); });
          }
         
        })
      } else if (movie.source === "scriptdrive") {
        fs.readFile(`${__dirname}/../../data/scriptdrive/${movie.link}`, (err, data) => {
          if(err){
            console.log(err)
            async.setImmediate(() => { cb1(); });
          } else {
              
            console.log(`${movie.link}`)
            fs.writeFile(`${__dirname}/../../data/script_downloads/pdf/scrape-${scrape_id}.pdf`, data);
            async.setImmediate(() => { cb1(); });
          }
         
        })
      } else if (movie.source === "manual"){

       
        // if(url.indexOf("imsdb") !== -1){
        //   //var fileName = url.replace("http://www.imsdb.com/scripts/", "")
        //   //console.log(`${__dirname}/../data/film_20100519/all_imsdb_05_19_10/${fileName}`)
        //   //fs.readFile(`${__dirname}/../data/film_20100519/all_imsdb_05_19_10/${fileName}`, "utf8", (err, data) => {
        //   request(url, (err, resp, data) => {
        //     if(err){
        //       async.setImmediate(() => { cb1(); });
        //     } else {
        //       var $ = cheerio.load(data); 
        //       //var selector = html_paths["http://www.imsdb.com"].path;
        //        var selector = ".scrtext";

        //       //$("#mainbody > table:nth-child(3) > tbody > tr > td:nth-child(3) > table.script-details > tbody > tr:nth-child(2) > td:nth-child(2) a:last-of-type")
        

        //       console.log($(selector).length)
        //       if($(selector).length > 0){
        //         fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $(selector).text());
        //       }
        //       async.setImmediate(() => { cb1(); });
        //     }
           
        //   })

        // } 
        //else {


          request.get({url: url, encoding: "binary", timeout: 120000}, (err, resp, body) => {

            if(err){
              console.log(err);
              newFails+= `${scrape_id}\n`;
              async.setImmediate(() => { cb1(); })
            } else {
              if(typeof resp !== "undefined" || resp.statusCode !== 404) {
                console.log(resp.caseless.dict['content-type'])

                if (resp.caseless.dict['content-type'] === "text/plain") {

                  console.log("TEXT")
                  fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, resp.body);
                  async.setImmediate(() => { cb1(); });

                } else if (resp.caseless.dict['content-type'] === "application/pdf") {
                  
                  console.log("PDF")
                  fs.writeFile(`${__dirname}/../../data/script_downloads/pdf/scrape-${scrape_id}.pdf`, body, 'binary');
                  async.setImmediate(() => { cb1(); });

                } else if (resp.caseless.dict['content-type'] === "text/html"  || resp.caseless.dict['content-type'].toLowerCase() === "text/html; charset=utf-8") {

                  console.log("HTML")
                  var matchedUrl = null;
                  for(var p in html_paths){
                    if(url.toLowerCase().startsWith(p.toLowerCase())){
                      matchedUrl = p;
                      break;
                    }
                  }

                  var $ = cheerio.load(body); 

                  if(matchedUrl){

                    // var pageType = html_paths[matchedUrl];
                    // var selector = "body > pre";
                    

                    fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $(body).text());
                    async.setImmediate(() => { cb1(); })
                    //   if(pageType.path){
                    //     selector = pageType.path;
                    //   }
                    //   console.log($(selector).text())
                    //   console.log(`html length: ${$(selector).length}`)

                    //   //if($(selector).length > 0){
                    //   if(url.indexOf("dailyscript") !== -1){

                    //     fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $("body > div.container > div:nth-child(3) > div > pre").text());
                    //      async.setImmediate(() => { cb1(); })

                    //     var href = $("a[href^=scripts]").attr("href") 
                    //     console.log(href)
                    //     if(typeof href !== "undefined"){
                    //       request.get({url: `http://www.horrorlair.com/movies/${href}`, encoding: "binary"}, (err1, resp1, body1) => {

                    //         console.log(`http://www.horrorlair.com/${href}`)
                    //         console.log( )
                    //         console.log(resp1.caseless.dict['content-type'])
                    //         console.log(resp1.caseless.dict['content-type'] === "application/pdf")
                    //         console.log( )
                          
                    //         if (["text/plain", "text/html"].indexOf(resp1.caseless.dict['content-type']) !== -1 ) {
                    //           console.log("HTML HERE")
                    //           var $1 = cheerio.load(body1); 
                    //           fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $1(body1).text());
                            
                    //         } else if (resp1.caseless.dict['content-type'] === "application/pdf") {
                    //           console.log("PDF HERE")
                    //           fs.writeFile(`${__dirname}/../../data/script_downloads/pdf/scrape-${scrape_id}.pdf`, body1, "binary");
                            
                    //         } 

                    //         async.setImmediate(() => { cb1(); })

                    //       });
                    //     } else {
                    //       async.setImmediate(() => { cb1(); })
                    //     }

                    //   } 
                    

                  } else {
                    console.log("NO MATCH")
                    fs.writeFile(`${__dirname}/../../data/script_downloads/text/scrape-${scrape_id}.txt`, $(body).text());
                   
                    async.setImmediate(() => { cb1(); })
                  }
                    
                } else {
                  newFails+= `${scrape_id}\n`;
                  async.setImmediate(() => { cb1(); })
                }
              } else {
                async.setImmediate(() => { cb1(); })
              }
            }
          });
        
        
      } else {
        console.log("BAD SOURCE")
        async.setImmediate(() => { cb1(); })
      }
    } 

  }, () => {
    fs.writeFile(`${__dirname}/../../data/dead-links.tsv`, newFails)
    cb();
  })
},
turnPDFsToText: (cb) => {
  
  var downloadDir = `${__dirname}/../../data/script_downloads`;
  //var pdfDirectory = `${downloadDir}/pdf/`;
  var pdfDirectory = `${downloadDir}/ocr_output/`;

  fs.readdir(pdfDirectory, (err, pdfs) => {

    var failedPDFScans = "";
    var index = 1;
    // pdfs = [1504, 1506, 1518, 1521, 1552, 1553, 1624, 1649, 1660, 1678, 1694, 1713, 1719, 1720, 1726, 
    //       1787, 1799, 1819, 1830, 1842, 1869, 1905, 1908, 1932, 1935, 1947, 1958, 1959, 1969, 1984, 2037, 2048, 
    //       2060, 2062, 2078, 2080, 2090, 2097, 2134, 2149, 2155, 2176, 2185, 2241, 2242, 2257, 2295, 2323, 2342, 
    //       2351, 2354, 2383, 2414, 2415, 2437, 2448, 2471, 2491, 2493, 2577, 2595, 2623, 2636, 2646, 2674, 2678, 
    //       2711, 2715, 2725, 2756, 2798, 2817, 2839, 2845, 2853, 2890, 2911, 2926, 2940, 2948, 2960, 2979, 3003, 
    //       3011, 3012, 3013, 3025, 3061, 3063, 3154, 3183, 3198, 3200, 3246, 3255, 3266, 3273, 3286, 3303, 3312, 
    //       3322, 3334, 3367, 3369, 3379, 3404, 3421, 3423, 3425, 3428, 3429, 3431, 3436, 3474, 3475, 3481, 3510, 
    //       3524, 3537, 3628, 3681, 3692, 3698, 3710, 3711, 3747, 3767, 3805, 3825, 3841, 3849, 3853, 3857, 3878, 
    //       3881, 3882, 3890, 3891, 3912, 3921, 3928, 3930, 3935, 3940, 3943, 3961, 3969, 3978, 3990, 3995, 4004, 
    //       4007, 4055, 4066, 4068, 4070, 4085, 4086, 4091, 4095, 4104, 4105, 4108, 4109, 4128, 4130, 4141, 4157, 
    //       4165, 4180, 4192, 4197, 4208, 4219, 4223, 4229, 4230, 4231, 4244, 4245, 4246, 4249, 4255, 4268, 4269, 
    //       4284, 4295, 4297, 4302, 4307, 4320, 4380, 4387, 4391, 4398, 4400, 4423, 4432, 4434, 4435, 4436, 4439, 
    //       4466, 4469, 4473, 4476, 4478, 4479, 4482, 4504, 4509, 4521, 4534, 4541, 4544, 4545, 4549, 4554, 4557, 
    //       4558, 4562, 4564, 4568, 4574, 4583, 4595, 4613, 4621, 4628, 4629, 4633, 4640, 4646, 4664, 4669, 4675, 
    //       4692, 4693, 4707, 4712, 4713, 4723, 4735, 4736, 4737, 4740, 4742, 4747, 4764, 4776, 4784, 4802, 4822, 
    //       4827, 4857, 4862, 4900, 4915, 4916, 4952, 4958, 4982, 4987, 4989, 4996, 5000, 5012, 5019, 5058, 5065, 
    //       5070, 5092, 5107, 5117, 5126, 5129, 5151, 5152, 5175, 5176, 5190, 5192, 5195, 5196, 5200, 5202, 5203, 
    //       5204, 5207, 5217, 5230, 5237, 5247, 5273, 5308, 5313, 5359, 5486, 5510, 5520, 5521, 5524, 5525, 5526, 
    //       5527, 5528, 5530, 5534, 5800, 5805, 5824, 5864, 5872, 5886, 5895, 5906, 5912, 5937, 5948, 5954, 5955, 
    //       5962, 5963, 5966, 5992, 5999, 6003, 6019, 6022, 6035, 6048, 6049, 6052, 6059, 6062, 6067, 6072, 6125, 
    //       6132, 6134, 6146, 6150, 6152, 6189, 6194, 6206, 6233, 6238, 6240, 6264, 6268, 6289, 6305, 6308, 6336, 
    //       6337, 6339, 6350, 6355, 6363, 6377, 6378, 6379, 6390, 6402, 6403, 6408, 6419, 6435, 6442, 6463, 6470, 
    //       6471, 6491, 6503, 6514, 6536, 6563, 6565, 6567, 6571, 6581, 6596, 6619, 6626, 6637, 6642, 6662, 6700, 
    //       6715, 6732, 6735, 6768, 6811, 6819, 6821, 6835, 6861, 6914, 6991, 7001, 7017, 7025, 7049, 7063, 7080, 
    //       7216, 7217, 7219, 7225, 7250, 7259, 7276, 7290, 7291, 7296, 7311, 7313, 7324, 7330, 7331, 7360, 7385, 
    //       7386, 7390, 7392, 7421, 7452, 7456, 7470, 7489, 7490, 7501, 7516, 7531, 7532, 7533, 7537, 7540, 7542, 
    //       7562, 7563, 7564, 7569, 7599, 7614, 7618, 7619, 7689, 7697, 7707, 7762, 7793, 7828, 7851, 7856, 7870, 
    //       7899, 7924, 7927, 7928, 7966, 7977, 7987, 8031, 8032, 8038, 8043, 8044, 8047, 8050, 8054, 8064, 8070, 
    //       8080, 8114, 8144, 8153, 8157, 8179, 8194, 8205, 8208, 8216, 8244, 8267, 8269, 8285, 8288, 8304, 8309, 
    //       8349, 8351, 8359, 8387, 8388, 8414, 8431, 8474, 8481, 8529, 8550, 8552, 8566, 8598, 8604, 8629, 8632, 
    //       8634, 8638, 8648, 8652, 8653, 8654, 8656, 8657, 8658, 8659, 8703, 8704, 8711, 8712, 8714, 8717, 8725, 
    //       8735, 8737, 8743, 8746, 8756, 8775, 8784, 8790, 8795, 8802, 8818, 8819, 8833, 8840, 8843, 8845, 8846, 
    //       8847, 8868, 8878, 8888, 8893, 8907, 8929, 8934, 8935, 8941, 8946, 8954, 8956, 8967, 8980, 8985, 8988, 
    //       8989, 9001, 9034, 9040, 9042, 9048, 9049, 9084, 9086, 9092, 9115, 9116, 9125, 9128, 9130, 9131, 9135, 
    //       9147, 9149, 9160, 9163, 9173, 9177, 9186, 9198, 9213, 9223, 9232, 9243, 9245].map((scrape_id) => {
    //           return `scrape-${scrape_id}.pdf`
    //         });

    async.forEachSeries(pdfs, (pdf, cb1) => {

      if(pdf !== ".DS_Store"){
        var fileName = pdf.slice(0, -4);
        var inputPDF = `${pdfDirectory}${pdf}`;
        var outputTxt = `${downloadDir}/text/${fileName}.txt`

        index++;

        //console.log(outputTxt)
        fs.exists(inputPDF, (exists) => {
          //if(true){
          if(exists) {

            console.log("--------------------------")
            console.log(fileName)
            console.log(`${index}/${pdfs.length}`)

            async.series({
              removePermissions: (cb2) => {

                console.log("removing passwords")
                exec(`mv ${inputPDF} ${pdfDirectory}temp.pdf; qpdf --decrypt ${pdfDirectory}temp.pdf ${inputPDF}; rm ${pdfDirectory}temp.pdf`,
                   (err, stdout, stderr) => {
                  if(err || stderr){
                    console.log(err)
                    console.log(stderr)
                  }
                  async.setImmediate(() => { cb2(); })
                });

              }, 
              textExtract: (cb2) => {

                console.log("extracting text")
                exec(`python ${__dirname}/../data/pdfminer-20140328/build/scripts-2.7/pdf2txt.py ${inputPDF}`, 
                  { maxBuffer: 1024 * 1000 },
                  (err, stdout, stderr) => {
                  if(err || stderr){
                    console.log(err)
                    console.log(stderr)
                    failedPDFScans += `${pdf}\n`
                  } else {
                    fs.writeFile(outputTxt, stdout)
                  }
                  async.setImmediate(() => { cb2(); })
                });
            
              }, 
              done: () => {
                 async.setImmediate(() => { cb1(); })
              }
            })

          
          } else {
            async.setImmediate(() => { cb1(); })
          }
        })
       
      } else {
        async.setImmediate(() => { cb1(); });
      }
     
    }, () => {
      console.log(failedPDFScans)
      cb();
    })

  })

},
done: () => {
  console.log(moment().diff(startTime, "minutes"))
  console.log("Finished: script-download.js")
 // callback();
}
});


