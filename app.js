const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const port = 3000;

require("dotenv").config();

app.set("view engine", "ejs");


app.use(express.static("public"));

app.use(express.urlencoded({
  extended: true
}));

// Connection and authentication to your database, in my case to MongoDB Atlas.
mongoose.connect(process.env.DBCONNECT);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list!",
});

const item2 = new Item({
  name: "Click on the + button to add an item",
});

const item3 = new Item({
  name: "<-- Click the checkmark to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, items){

    if(items.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully added default items.");
        }
        res.redirect("/");
      });

    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});

app.get("/:customListName", function(req,res){
  
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, listFound){
    if (err){
      console.log(err);
    } else {
      if (listFound){

        res.render("list", {
          listTitle: listFound.name,
          newListItems: listFound.items,
        });

      } else {


        const list = new List({
          name: customListName,
          items: defaultItems,
        });
      
        list.save(function(err,result){
          res.redirect("/" + customListName);
        });
      }

    }
  });

});

app.post("/", function(req, res) {
  
  const itemName = req.body.itemBox;
  const listName = req.body.addButton;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today"){

    newItem.save(function(err, result){
      res.redirect("/");
    });


  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save(function(err,result){
        res.redirect("/" + listName);
      });
   
    });
  }
  


});

app.post("/delete", function(req,res){

  const itemObj = JSON.parse(req.body.checkbox);

  if(itemObj.listName === "Today"){
    Item.findByIdAndRemove(itemObj.itemId, function(err){
      if (err){
        console.log(err);
      } else{
        console.log("Successfully deleted the item");
        res.redirect("/");
      }
    });

  } else{
    List.findOneAndUpdate({name: itemObj.listName}, {$pull: {items:{_id: itemObj.itemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + itemObj.listName);
      }
    });

  }
});

app.listen(process.env.PORT || port, function(){
  console.log("App started successfully");
});
