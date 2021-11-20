const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
let razorpay = require("razorpay");
const crypto = require('crypto');
const { ObjectId } = require("bson");


const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 80;    // For Heroku
app.use("/static", express.static("static"));

const RAZORPAY_KEY_SECRET = '<actual_razorpay_key_secret>';

mongoose.connect("mongodb+srv://<username>:<password>@soumyamoy.d1wnb.mongodb.net/PaymentGateway1?retryWrites=true&w=majority");

//Defining "receipt" schema
const receiptSchema = new mongoose.Schema({
    name: String,
    mobno: String,
    email: String,
    amount: Number,
    date: Date,
    orderId: String,
    orderPayId: String
});

//receipts is the collection name ---> "receipts" collection
const receipt = mongoose.model("receipts", receiptSchema, "receipts");


let instance = new razorpay({
    key_id: 'rzp_test_Ofbdxw5i9QfvYT',              // your `KEY_ID`
    key_secret: RAZORPAY_KEY_SECRET          // your `KEY_SECRET`
})

    
app.post("/getOrderId", (req, res) => {
    // console.log(req);
    let options = {
        amount: Number(req.body.amount)*100,            // amount in the smallest currency unit
        currency: "INR",
        receipt: "donReceipt#1"
    };

    instance.orders.create(options, function(err, order) {
        // console.log(order);
        return res.json({ orderId : order.id });
    });

});


app.post("/saveDatabase", (req, res) => {

    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);

    hmac.update(req.body.orderId + "|" + req.body.orderPayId);
    let generatedSignature = hmac.digest('hex');

    if(generatedSignature === req.body.orderSignature)
    {
        const myobj = {
            name: req.body.name,
            mobno: req.body.mobno,
            email: req.body.email,
            amount: req.body.amount,
            date: new Date(req.body.date),
            orderId: req.body.orderId,
            orderPayId: req.body.orderPayId
        };

        const receiptData = new receipt(myobj);
        receiptData.save();

        return res.json({status: true});
    }
        
    else 
        return res.json({status: false});
})

app.post("/fetchData", (req, res) => {
    receipt.findOne({orderPayId: req.body.orderPayId}, (err, data) => {
        try{
            return res.json({found: true, name: data.name, mobno: data.mobno, email: data.email, amount: data.amount, date: data.date, orderId: data.myOrderId, orderPayId: data.orderPayId});
        }catch(e){
            return res.json({found: false});
        }
    });
})


app.get("/", (req, res) => {
    return res.render(__dirname+"/home.ejs");
})


app.listen(port, () => { console.log("!!!Server started successfully!!!"); });