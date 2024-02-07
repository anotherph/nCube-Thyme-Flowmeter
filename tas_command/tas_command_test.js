/**
 * Created by ryeubi on 2015-08-31.
 * Updated 2017.03.06
 * Made compatible with Thyme v1.7.2
 */


const mqtt = require('mqtt');
const {nanoid} = require('nanoid');
let Gpio = require('onoff').Gpio;

let c_flowmeter = new Gpio(6, 'out'); // 유량계
let c_pump = new Gpio(10, 'out'); // 펌프

function control_equip(command){
    if (command = "on"){
        c_flowmeter.writeSync(1);
        c_pump.writeSync(1);
    }
    else if(command = "off"){
        c_flowmeter.writeSync(0);
        c_pump.writeSync(0);
    }
    else{
        all_Gpio_off();
        console.log("not defined type")
    }
}

function all_Gpio_off(){
    c_flowmeter.writeSync(0);
    c_pump.writeSync(0);
}

let tas = {
    client: {
        connected: false,
    },

    connection: {
        host: '192.168.51.174', // tas IP 
        port: 1883,
        endpoint: '',
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 4000,
        clientId: 'tas_' + nanoid(15),
        username: 'keti_thyme',
        password: 'keti_thyme',
    },
};

let sendDataTopic = {
    // co2: '/thyme/co2',
    // tvoc: '/thyme/tvoc',
    // temp: '/thyme/temp',
};

let recvDataTopic = {
    // led: '/led/set',
    command: '/KETI_Flowmeter/command'
};
/* */

 
let createConnection = () => {
    control_equip("on");
}

createConnection();
