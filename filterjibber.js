

// these don't work - mongoose data special object
    
    let oldNews = oldNewsTemp.map(story => {
      delete story._id;
      delete story.__v;
      return story;
    }
      );

    oldNews.forEach(() => {
      delete this._id;
      delete this.__v;
    });



// so make new array with just properties i need first ...
    
    let oldNewsTrim = oldNews.map(story => ({
        title: story.title,
        byline: story.byline,
        img: story.img,
        body: story.body,
        url: story.url
    }));
// but this doesn't work
    let newNews = resArr.filter(story => {
      return !oldNews.includes(story)
    });



// current attempt:

    let newNews = resArr.filter(newStory => {
        oldNews.forEach(function() {
            if (this.title == newStory.title) return false; 
            return newStory;
        };
    });
        