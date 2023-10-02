//campground Schema Setup
var mongoose=require('mongoose');

var campgroundSchema=new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String,
    author:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        username: String
    },
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'comment'
        }
    ]
  });
  
  var Campgrounds=mongoose.model('Campgrounds',campgroundSchema);

  module.exports=Campgrounds;