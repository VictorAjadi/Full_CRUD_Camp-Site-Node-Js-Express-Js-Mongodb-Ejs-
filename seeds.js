var mongoose    = require('mongoose');
var Campground  = require('./models/campground');
var comment     = require('./models/comment');
var data=[
  {name: 'James bron',
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyG0naLvtHHxByqBP6tiDOMFTXBjHY99rniLrW3qP2tA&s',
  description: 'it has been an awesome day'
  },
  {name: 'Abraham Chase',
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST6L3-1aaGMhzEQj62y4sl8FCqXowopk6aKKjrpxGAtg&s',
  description: 'blah blah blah'
  },
  {name: 'jaquar',
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaP8GoZZVMsf96zyyma3pJ-cU9pBSH-_cLoeMOc0thiA&s',
  description: 'blah blah blah.......'
  }
]

function seedDB(){
  //remove all campground
     Campground.deleteMany({})
     .then(()=>{
       console.log('removed campgrounds');
       //creating new campground from data
       data.forEach(function(seed){
        Campground.create(seed)
        .then(newSeed =>{
             console.log('Document Created......');
           //create new comment
             comment.create({
               text: 'welcome to the greatest campground in the world',
               author: 'james'
             })
             .then(newComment=>{
                 newSeed.comment.push(newComment);
                 newSeed.save()
                 .then(()=>{
                   console.log('created new comment');
                 })
                 .catch(error=>{
                   console.error(error);
                 });
             })
             .catch(error=>{
               console.error(error);
             });
        })
        .catch(error=>{
          console.error(error);
        });
      }); 
     })
   .catch(error=>{
     console.error(error);
   });
}

module.exports = seedDB;
