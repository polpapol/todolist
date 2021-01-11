const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
let alert = require('alert');
const app = express();
const mongoose = require('mongoose');
const _ = require("lodash");

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));


//mongodb connection
mongoose.connect("mongodb+srv://admin-paul:pass.123@cluster0.2xxzz.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
//mongodb collection name
const itemSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an Item."
});
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    let day = date.getDate();
    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added to DB");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                kindOfDay: day,
                newListItems: foundItems,
            })
        }
    });
});

app.post("/", function (req, res) {
    let day = date.getDate();
    const item = req.body.newItem;
    const list = req.body.list;
    const itemNew = new Item({
        name: item
    });
    if (list === day) {
        itemNew.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: list
        }, function (err, foundList) {
            foundList.items.push(itemNew);
            foundList.save();
            res.redirect("/" + list);
        })
    }
});

app.post("/delete", function (req, res) {
    let day = date.getDate();
    const checked = req.body.checkbox;
    const listName = req.body.listName;

    if (listName == day) {
        Item.findByIdAndDelete(checked, function (err) {
            if (!err) {
                console.log("Successfully removed from DB");
            }
        })
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checked}}}, function(err,foundList){
            if (!err){
                res.redirect("/"+listName);
            }
        })
    }

});

app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show Existing list
                res.render("list", {
                    kindOfDay: foundList.name,
                    newListItems: foundList.items,
                })
            }
        }
    });


});


app.listen(3000, function () {
    console.log("Server running on port 3000");
});