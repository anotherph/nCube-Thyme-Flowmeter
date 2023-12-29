const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://127.0.0.1:1883');

let topicSubscribed = false;

function waitForTopic(callback) {
  client.subscribe('/mobius/letMobiusKnow', () => {
    console.log('Subscribed to the topic');
    topicSubscribed = true;
    callback();
  });
}

function doFunction() {
  // Your asynchronous logic here
  console.log('Doing some work...');
  // Simulate asynchronous work with a timeout
  setTimeout(() => {
    console.log('Work completed.');
    // Set topicSubscribed to false to wait for the next subscription event
    topicSubscribed = false;
  }, 5000);
}

client.on('message', (topic, message) => {
  // Check if the subscribed topic is received
  if (topic === '/mobius/letMobiusKnow' && topicSubscribed) {
    doFunction();
  }
});

client.on('connect', () => {
  // Perform any setup logic here
  console.log('Connected to MQTT broker');
  waitForTopic(() => {
    // You can add additional logic here after subscribing to the topic
  });
});