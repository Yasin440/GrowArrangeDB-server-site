const express = require("express");
const cors = require("cors");
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const fileUpload = require('express-fileupload');
require("dotenv").config();
//******script api secret key******//
// const stripe = require("stripe")(process.env.STRIPE_SECRET);
//---------- app.use(express.static("public"));

const app = express();
const port = process.env.PORT || 4000

//****middleware****//
app.use(cors());
app.use(express.json());
// app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mllmf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("growth_arrange");
        const categoryCollection = database.collection("categories");
        const servicesCollection = database.collection("allServices");
        const clientsCollection = database.collection('clients');
        const orderCollection = database.collection('all_orders');
        const ticketsCollection = database.collection('tickets');
        // const carOrdersCollection = database.collection('orderedCars');
        // const clientsAllRating = database.collection('ratings');

        // // //== get api for client reviews ==//
        // app.get('/reviews', async (req, res) => {
        //     const cursor = clientsAllRating.find({}).limit(6);
        //     const reviews = await cursor.toArray();
        //     res.send(reviews);
        // })

        // //== get api to get a email which is admin==//
        app.get('/client/isAdmin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await clientsCollection.findOne(query);
            let isAdmin = false;
            if (result?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        //register
        app.post('/users/register', async (req, res) => {
            try {
                const salt = await bcrypt.genSalt()
                const hashedPassword = await bcrypt.hash(req.body.password, salt)
                const user = { email: req.body.email, password: hashedPassword }
                const result = await clientsCollection.insertOne(user);
                res.send(result)
                res.status(201).send()
            } catch {
                res.status(500).send()
            }
        })
        //login api
        app.post('/users/login', async (req, res) => {
            const users = await clientsCollection.find({}).toArray();
            console.log(users);
            const found = users.find(user => user.email = req.body.email);
            if (found == 'undefined') {
                return res.status(400).send('Cannot find user');
            }
            try {
                if (await bcrypt.compare(req.body.password, found.password)) {
                    res.json({ message: 'Login Successful' })
                } else {
                    res.json({ error: 'Invalid email or password' })
                }
            } catch {
                res.status(500).send()
            }
        })

        // //== GET app for 6 cars ==//
        // app.get('/cars', async (req, res) => {
        //     const cursor = carsCollection.find({}).limit(6);
        //     const cars = await cursor.toArray();
        //     res.send(cars);
        // })

        // //GET app for all cars
        // app.get('/cars/all', async (req, res) => {
        //     const cursor = carsCollection.find({});
        //     const cars = await cursor.toArray();
        //     res.send(cars);
        // })
        //get category
        app.get('/getCategory', async (req, res) => {
            const cursor = categoryCollection.find({});
            const category = await cursor.toArray();
            res.send(category);
        })
        // //get api for services with services
        app.get('/allServices/:category', async (req, res) => {
            const category = req.params.category;
            const result = await servicesCollection.find({ category: category }).sort({ $natural: -1 }).toArray();
            res.send(result);
        })
        //get api for all order with services
        app.get('/order/allOrder/:category', async (req, res) => {
            const category = req.params.category;
            const result = await orderCollection.find({ category: category }).sort({ $natural: -1 }).toArray();
            res.send(result);
        })
        app.get('/order/allOrder', async (req, res) => {
            const result = await orderCollection.find({}).toArray();
            res.send(result);
        })
        app.get('/order/lastOrder', async (req, res) => {
            const result = await orderCollection.find({}).sort({ $natural: -1 }).limit(1).toArray();
            res.send(result);
        })
        //get tickets
        app.get('/tickets/allTickets/all', async (req, res) => {
            const result = await ticketsCollection.find({}).sort({ $natural: -1 }).toArray();
            res.send(result);
        })
        app.get('/tickets/allTickets/:email', async (req, res) => {
            const email = req.params.email;
            const result = await ticketsCollection.find({ email: email }).sort({ $natural: -1 }).toArray();
            res.send(result);
        })
        app.get('/tickets/lastTickets', async (req, res) => {
            const result = await ticketsCollection.find({}).sort({ $natural: -1 }).limit(1).toArray();
            res.send(result);
        })
        //get all clients api
        app.get('/user/allUsers', async (req, res) => {
            const result = await clientsCollection.find({}).toArray();
            res.send(result);
        })
        //get clients email api
        app.get('/user/allUsers/:email', async (req, res) => {
            const email = req.params.email;
            const result = await clientsCollection.findOne({ email: email });
            res.send(result);
        })
        //get api for a single service with _id
        app.get('/dashboard/newOrder/:_id', async (req, res) => {
            const id = req.params._id;
            const result = await servicesCollection.findOne({ _id: ObjectId(id) });
            res.json(result);
        })
        app.get('/dashboard/newOrder/:title', async (req, res) => {
            const title = req.params.title;
            const result = await servicesCollection.findOne({ title: title });
            res.json(result);
        })
        //get all order with email api
        app.get('/order/myOrder/:email', async (req, res) => {
            const email = req.params.email;
            const cursor = await orderCollection.find({ email: email }).sort({ $natural: -1 }).toArray();
            res.send(cursor);
        })
        //get single order with _id api
        app.get('/order/getOrder_forEdit/:id', async (req, res) => {
            const id = req.params.id;
            const cursor = await orderCollection.findOne({ _id: ObjectId(id) });
            res.json(cursor);
        })
        // //get api for all orders of car
        // app.get('/orderedCars/all', async (req, res) => {
        //     const cursor = carOrdersCollection.find({});
        //     const allOrderedCars = await cursor.toArray();
        //     res.send(allOrderedCars);
        // })

        // //get api for orders with email Id
        // app.get('/orderedCars/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email: email };
        //     const cursor = carOrdersCollection.find(query);
        //     const allMyOrderedCars = await cursor.toArray();
        //     res.send(allMyOrderedCars);
        // })
        // app.get('/orderedCars/payment/:_id', async (req, res) => {
        //     const id = req.params._id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await carOrdersCollection.findOne(query);
        //     res.send(result);
        // })

        // //get api for one car doc with id query
        // app.get('/carDetails/:_id', async (req, res) => {
        //     const id = req.params._id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await carsCollection.findOne(query);
        //     res.send(result);
        // })

        //POST API to add user through email and pass
        app.post('/clients', async (req, res) => {
            const client = req.body;
            const result = await clientsCollection.insertOne(client);
            res.json(result);
        })

        //POST to update category
        app.post('/addCategory', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.json(result);

        })
        //POST Services
        app.post('/addServices', async (req, res) => {
            const services = req.body;
            const result = await servicesCollection.insertOne(services);
            res.json(result);
        })
        //post order api
        app.post('/order/addOrder', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.json(result);
        })

        //post tickets api
        app.post('/tickets/addTickets', async (req, res) => {
            const order = req.body;
            const result = await ticketsCollection.insertOne(order);
            res.json(result);
        })

        // //***/== POST API to add ratings ==/***//

        // app.post('/ratings', async (req, res) => {
        //     const rating = req.body;
        //     const result = await clientsAllRating.insertOne(rating);
        //     res.json(result);
        // })

        // //POST API to add cars in carsCollection
        // app.post('/addCars', async (req, res) => {
        //     const clientName = req.body.clientName;
        //     const name = req.body.name;
        //     const email = req.body.email;
        //     const price = req.body.price;
        //     const details = req.body.details;
        //     const picture = req.body.picture;
        //     const picData = req.files.picture2.data;
        //     const encodedPic = picData.toString('base64');
        //     const imgBuffer = Buffer.from(encodedPic, 'base64');
        //     const newCar =
        //     {
        //         clientName, name, email, price, picture, picture2: imgBuffer, details
        //     }
        //     const result = await carsCollection.insertOne(newCar);
        //     res.json(result);
        // })

        // //----post api for add ordered cars details
        // app.post('/orderedCars', async (req, res) => {
        //     const carOrders = req.body;
        //     const result = await carOrdersCollection.insertOne(carOrders);
        //     res.json(result)
        // })
        //update clients balance
        app.post('/clients/update/balance', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const options = { upsert: true };
            const updateOrder = {
                $set: {
                    balance: user.balance,
                    currency: "taka"
                }
            };
            const result = await clientsCollection.updateOne(query, updateOrder, options);
            res.json(result);
        })

        //------put client through gmail or other authentication
        app.put('/clients', async (req, res) => {
            const client = req.body;
            const query = { email: client.email };
            const options = { upsert: true };
            const updateClient = { $set: client };
            const result = await clientsCollection.updateOne(query, updateClient, options);
            res.json(result);

        })
        //update order
        app.put('/order/getOrder_forEdit/update', async (req, res) => {
            const order = req.body;
            const query = { _id: ObjectId(order._id) };
            const options = { upsert: true };
            const updateOrder = {
                $set: {
                    start_count: order.start_count,
                    remains: order.remains,
                    status: order.status,
                    payment: order.payment
                }
            };
            const result = await orderCollection.updateOne(query, updateOrder, options);
            res.json(result);
        })
        //update ticket status
        app.put('/update/ticket/status/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const update = {
                $set: {
                    status: "completed"
                },
            };
            const result = await ticketsCollection.updateOne(query, update, options);
            res.json(result);
            console.log(result);
        })
        // //***/== Put api to update client admin role ==/***//
        // app.put('/clients/makeAdmin', async (req, res) => {
        //     const user = req.body;
        //     const query = { email: user.email };
        //     const updateDoc = { $set: { role: 'admin' } }
        //     const result = await clientsCollection.updateOne(query, updateDoc);
        //     res.json(result);

        // })
        // // put api to update order status
        // app.put('/ordered_car/status/:_id', async (req, res) => {
        //     const id = req.params._id;
        //     const query = { _id: ObjectId(id) };
        //     const updateDoc = {
        //         $set: {
        //             status: "approved"
        //         },
        //     }
        //     const result = await carOrdersCollection.updateOne(query, updateDoc);
        //     res.json(result);
        // })
        // // put api to update order payment status
        // app.put('/ordered_car/payment_status/:_id', async (req, res) => {
        //     const id = req.params._id;
        //     const paymentInfo = req.body;
        //     console.log(paymentInfo);
        //     const query = { _id: ObjectId(id) };
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             status: "paid",
        //             paymentInfo: paymentInfo,
        //         },
        //     }
        //     const result = await carOrdersCollection.updateOne(query, updateDoc, options);
        //     res.json(result);
        // })

        // //delete api to delete an order from all orders
        app.delete('/allServices/delete/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.json(result);
        })
        //delete tickets with id
        app.delete('/allTickets/delete/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await ticketsCollection.deleteOne(query);
            res.json(result);
        })
        // //delete api to delete one car from all cars
        // app.delete('/all_Cars/delete/:_id', async (req, res) => {
        //     const id = req.params._id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await carsCollection.deleteOne(query);
        //     res.json(result);
        //     console.log(result);
        // })
        // //payment post api with stripe
        // app.post("/create-payment-intent", async (req, res) => {
        //     const paymentInfo = req.body;
        //     const amount = paymentInfo.price * 100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         currency: "usd",
        //         amount: amount,
        //         payment_method_types: ["card"],
        //     })
        //     res.json({
        //         clientSecret: paymentIntent.client_secret,
        //     })
        // })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.json('This a Server to Connect "Growth Arrange DB" with backEnd');
})
app.listen(port, () => {
    console.log('Growth Arrange DB is running on:', port);
})