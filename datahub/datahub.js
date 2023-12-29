const fs = require('fs');
const { get } = require('http');
const mqtt = require('mqtt');

// conf
conf = require('../conf.js');
const {host, port, endpoint, ...options} = conf.tas.connection;
const connectUrl = `mqtt://${host}:${port}${endpoint}`
const client = mqtt.connect(connectUrl);

// Topic
let mobiusTopic = {
    mobius: '/mobius/letMobiusKnow',
};

// var 
let topicSubscribed = false;
let requestBodyJson = {};
let retriData = {};

let loadEntity = () => {
    console.log('Load entity of waterflow data model...')
    const pathBodyJson = "entity.json";
    // Reading JSON from a file
    const waterFlowRequestBody = JSON.parse(fs.readFileSync(pathBodyJson, 'utf8'));
    // Converting JSON object to string
    requestBodyJson = JSON.stringify(waterFlowRequestBody);
    // Converting back to a JavaScript object (dictionary)
    requestBodyJson = JSON.parse(requestBodyJson);
    console.log('json file of data model has been loaded')
    // console.log(requestBodyJson)    
}

loadEntity();

function waitForTopic(callback) {
  client.subscribe(mobiusTopic.mobius, () => {
    console.log('Subscribed to the topic');
    topicSubscribed = true;
    callback();
  });
}

function setResource() {
    /* user code */
    getData();
    setEntity();
}

client.on('message', (topic, message) => {
  // Check if the subscribed topic is received
  if (topic === mobiusTopic.mobius && topicSubscribed) {
    setResource();
  }
});

client.on('connect', () => {
  // Perform any setup logic here
  console.log('Connected to MQTT broker');
  waitForTopic(() => {
    // You can add additional logic here after subscribing to the topic
  });
});

let getData = () => {
    const axios = require('axios');
    let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'http://172.20.0.109:7579/Mobius/KETI_Flowmeter/flowmeter/la', // add Mobius IP to conf.js
    headers: { 
        'Accept': 'application/json', 
        'X-M2M-RI': '12345', 
        'X-M2M-Origin': 'SKETI_Flowmeter'
    }
    };
    axios.request(config)
    .then((response) => {
    // console.log(JSON.stringify(response.data));
    retriData=JSON.stringify(response.data)
    // console.log(retriData)
    })
    .catch((error) => {
    console.log(error);
    });
}

let setEntity = () => {
    // const parsedData = JSON.parse(retriData);
    const conData = retriData["con"];
    console.log(typeof retriData)

    // // flowrate
    // const mFlowrate = conData.m_flowrate
    // matches = mFlowrate.match(/\d+\.\d+/);
    // mFlowrate=matches && matches[0];
    // console.log(mFlowrate)
    
    // // speed of water
    // const mSpeed = conData.m_speed
    // matches = mSpeed.match(/\d+\.\d+/);
    // mSpeed=matches && matches[0];
    // console.log(mSpeed)
    
    // current time
    // const curTime = conData.cur_time

}
