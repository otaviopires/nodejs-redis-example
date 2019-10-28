// set up dependecies 

const express = require("express");
const redis = require("redis");
const axios = require("axios");
const bodyParser = require("body-parser");

//setup port constants
const port_redis = process.env.PORT || 6379;
const port = process.env.PORT || 5000;

//configure redis client on port 6379
const redis_client = redis.createClient(port_redis);

//configure express server
const app = express();

//Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Middleware function to check cache
checkCache = (req, res, next) => {
	console.log("entering middleware");
	const { id } = req.params;

	redis_client.get(id, (err, data) => {
		if (err) {
			console.log(err);
			res.status(500).send(err);
		}
		//if no match found 
		if (data != null) {
			console.log("Using middleware");
			res.send(data);
		} else {
			//proceed to next middleware function
			console.log("middleware data is null")
			next();
		}
	});

};

// Endpoint: GET /starships/:id
// @desc Return Startships data from particulars starship id
app.get("/starships/:id", checkCache, async (req, res) => {
	try {
		const { id } = req.params;
		const starShipInfo = await axios.get(
			`https://swapi.co/api/starships/${id}`
		);

		//get data from response
		const starShipInfoData = starShipInfo.data;

		redis_client.setex(id, 3600, JSON.stringify(starShipInfoData));

		console.log("Using normal endpoint");
		return res.json(starShipInfoData);
	} catch (error) {
		console.log(error);
		return res.status().json(error);
	}
});

//listen on port 5000
app.listen(port, () => console.log(`Server running on Port ${port}`));
