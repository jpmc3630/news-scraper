require('dotenv').config();
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var helpers = require("./helpers"); 

var PORT = 3000;

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder

app.use(express.static("public"));

// Connect to the Mongo DB

mongoose.connect("mongodb://localhost/news", { useNewUrlParser: true });

// var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news";
// mongoose.connect(MONGODB_URI);




// Routes

app.get('/scrape', async (req, res) => {
  try {
    const response = await axios.get('https://www.space.com/news');

    const $ = cheerio.load(response.data);

    let resArr = [];
    let hashArr = [];

    $('article.search-result-news').each(function (i, elem) {
      let title = $(this).find('.article-name').text();
      let img = $(this).find('img').attr('data-src');
      let byline = $(this).find('.byline').text().replace(/(\r\n|\n|\r)/gm,"").trim();
      byline = [byline.slice(0, 2), ' ', byline.slice(2)].join('');
      let body = $(this).find('.synopsis').text().replace(/(\r\n|\n|\r)/gm,""); 
      let url = $(this).parent().attr('href');
      
      let obj = {
        title,
        byline,
        img,
        body,
        url
      }
      
      resArr.push(obj);
      hashArr.push(helpers.hashMD5(obj));
    });

    // let oldNews = await db.headlines.find();
    console.log('hash array:');
    console.log(hashArr);

    let hashesFound = await db.headlinesHash.find({
        hHash : hashArr
      });

    console.log('hashes found:');
    console.log(hashesFound);

    let newHashes = [];
    let newNews = [];
    
    for ( let i = 0 ; i < hashArr.length ; i++ ) {
      let match = false;
      for ( let j = 0 ; j < hashesFound.length ; j++ ) {
        if (hashArr[i] == hashesFound[j].hHash) match = true;
      }
      if (match == false) {
        newHashes.push({ hHash : hashArr[i] });
        newNews.push(resArr[i]);
      }
    }


    console.log('new hashes:');
    console.log(newHashes);
    console.log('new news:');
    console.log(newNews);

    console.log('new hashes count:');
    console.log(newHashes.length);
    console.log('new news count:');
    console.log(newNews.length);
 
    await db.headlinesHash.create(newHashes);
    await db.headlines.create(newNews);

    let news = await db.headlines.find();

    let str = ``
    news.forEach((fish) => {
      str+= `<link rel="stylesheet" type="text/css" href="styles.css">
      <div class="container">
      <div class="topRightShadowBlur" style="background-color: lightgray; padding: 20px; margin: 10px; drop-shadow: 10px;">
      <h3>${fish.title}<h3>
      <img src="${fish.img}" style="float:left; height: 140px;">
      
      <h6>${fish.byline}<h6>
          <p>${fish.body}</p>
            <a href="${fish.url}">Link</a>
              </div>
              </div>`;
    });

    res.send(str);

  } catch (error) {
    console.error(error);
  }
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
