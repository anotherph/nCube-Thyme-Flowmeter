const fs = require('fs');
const { get } = require('http');
const mqtt = require('mqtt');
const axios = require('axios');

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

var mFlowrate = {};
var mSpeed = {};
var curTime= {};

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

// let setResource = (callback) => {
//   waitForTopic(() => {
//     getData((error, data) => {
//       if (error) {
//         callback(error, null); // Pass the error to the outer callback
//       } else {
//         setEntity(data);
//         // Pass the data to postData, and provide a callback for postData
//         postData(data, (postError, result) => {
//           if (postError) {
//             callback(postError, null); // Pass the error to the outer callback
//           } else {
//             callback(null, result); // Call the outer callback with result
//           }
//         });
//       }
//     });
//   });
// };

let setResource = (callback) => {
  waitForTopic(() => {
    getData((error, data) => {
      if (error) {
        callback(error, null);
      } else {
        // Get the updated data from setEntity
        const updatedData = setEntity(data);
        postData(updatedData, (postError, result) => {
          if (postError) {
            callback(postError, null);
          } else {
            callback(null, result);
          }
        });
      }
    });
  });
};

client.on('message', (topic, message) => {
  // Check if the subscribed topic is received
  if (topic === mobiusTopic.mobius && topicSubscribed) {
    // setResource();
    setResource((error, result) => {
      if (error) {
        console.error(error);
      } else {
        console.log(result);
      }
    });
  }
});

client.on('connect', () => {
  // Perform any setup logic here
  console.log('Connected to MQTT broker');
  waitForTopic(() => {
    // You can add additional logic here after subscribing to the topic
  });
});

let getData = (callback) => {
  console.log('order: 1');
  let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'http://172.20.0.109:7579/Mobius/KETI_Flowmeter/flowmeter/la', // add mobius IP to conf.js
      headers: {
          'Accept': 'application/json',
          'X-M2M-RI': '12345',
          'X-M2M-Origin': 'SKETI_Flowmeter'
      }
  };
  axios.request(config)
      .then((response) => {
          retriData = JSON.stringify(response.data);
          // console.log(retriData);
          callback(null, retriData); // Call the callback with data (no error)
      })
      .catch((error) => {
          console.log(error);
          callback(error, null); // Call the callback with an error
      });
};

let setEntity = (retriData) => {

  console.log('order: 2');
  
  //set entity
  mFlowrate=JSON.parse(retriData)["m2m:cin"]["con"]["m_flowrate"];
  var matches = mFlowrate.match(/\d+\.\d+/);
  mFlowrate = matches && matches[0];
  
  mSpeed=JSON.parse(retriData)["m2m:cin"]["con"]["m_speed"];
  matches = mSpeed.match(/\d+\.\d+/);
  mSpeed = matches && matches[0];

  curTime=JSON.parse(retriData)["m2m:cin"]["con"]["cur_time"];
  curTime='20' + curTime.replace(/\s/g, 'T') + 'Z';

  // set json file
  requestBodyJson['entities'][0]['flowRate']['value']=mFlowrate
  requestBodyJson['entities'][0]['flowRate']['observedAt']=curTime
  requestBodyJson['entities'][0]['velocity']['value']=mSpeed
  requestBodyJson['entities'][0]['velocity']['observedAt']=curTime

  // console.log(requestBodyJson)

  let updatedRequestBodyJson = {
    ...requestBodyJson,
    entities: [
      {
        ...requestBodyJson.entities[0],
        flowRate: {
          ...requestBodyJson.entities[0].flowRate,
          value: mFlowrate,
          observedAt: curTime,
        },
        velocity: {
          ...requestBodyJson.entities[0].velocity,
          value: mSpeed,
          observedAt: curTime,
        },
      },
    ],
  };

  return updatedRequestBodyJson;  // Return the updated data
  
};

let postData = (requestBodyJson, callback) => { // Add callback parameter
  console.log('order: 3');

  // const apiURL = 'http://203.253.128.181:11003/entityOperations/upsert'; // add mobius IP to conf.js
  const apiURL = 'http://172.20.0.168:8081/entityOperations/upsert';
  const requestHeaders = {
    'Content-Type': 'application/json'
  };

  console.log(requestBodyJson)

  axios.post(apiURL, requestBodyJson, { headers: requestHeaders })
    .then(response => {
      // console.log(response.status);
      // console.log(response.data);
      callback(null, response.data); // Call the callback with result
    })
    .catch(error => {
      // console.error(error);
      callback(error, null); // Call the callback with an error
    });
}
