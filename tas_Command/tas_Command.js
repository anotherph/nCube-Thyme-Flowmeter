/**
 * Created by ryeubi on 2015-08-31.
 * Updated 2017.03.06
 * Made compatible with Thyme v1.7.2
 */

/*
24/02/07 test 결과
유량계 - 6, 펌프 - 10 이든 유량계 - 10, 펌프 - 6 이든 결과가 동일했음
command 에 off 로 넣어야 켜짐(tas_command_test_on.js), command 에 on 로 넣어야 켜짐(tas_command_test_off.js) 
유량계 6 번만 테스트할경우, off 를 하면 유량계/펌프 둘다 켜지고 (tas_command_test_on_6.js) on 을 해도 둘다 꺼지지 않음 (tas_command_test_off_6.js)
*/

const mqtt = require('mqtt');
const {nanoid} = require('nanoid');
let Gpio = require('onoff').Gpio;

let c_flowmeter = new Gpio(6, 'out'); // 유량계
let c_pump = new Gpio(10, 'out'); // 펌프
c_flowmeter.writeSync(1); // set 1 to initialize
c_pump.writeSync(1); // set 1 to initialize

function control_equip(command){
    if (command == "on"){ 
        console.log('command is "on"');
        c_flowmeter.writeSync(0);
        c_pump.writeSync(0);
    }
    else if(command == "off"){ 
        console.log('command is "off"');
        c_flowmeter.writeSync(1);
        c_pump.writeSync(1);
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
    command: '/command' // tas 용 topic
//    command: '//Mobius/KETI_Flowmeter/command'
};
/* */

let createConnection = () => {
    if (tas.client.connected) {
        console.log('Already connected --> destroyConnection')
        destroyConnection();
    }

    if (!tas.client.connected) {
        tas.client.loading = true;
        const {host, port, endpoint, ...options} = tas.connection;
        const connectUrl = `mqtt://${host}:${port}${endpoint}`
        console.log(connectUrl);
        try {
            tas.client = mqtt.connect(connectUrl, options);

            tas.client.on('connect', () => {
                console.log(host, 'Connection succeeded!');

                tas.client.connected = true;
                tas.client.loading = false;

                for(let topicName in recvDataTopic) {
                    if(recvDataTopic.hasOwnProperty(topicName)) {
                        doSubscribe(recvDataTopic[topicName]);
                    }
                }
            });

            tas.client.on('error', (error) => {
                console.log('Connection failed', error);

                destroyConnection();
            });

            tas.client.on('close', () => {
                console.log('Connection closed');

                destroyConnection();
            });

            tas.client.on('message', (topic, message) => {
                let content = null;

                /* USER CODES */
                if(topic === recvDataTopic.command) {
                // 유량계 테스트 결과
                   console.log("---> command message: ", message.toString());
                   control_equip(message.toString()); 
                }
            });
        }
        catch (error) {
            console.log('mqtt.connect error', error);
            tas.client.connected = false;
        }
    }
};

let doSubscribe = (topic) => {
    if (tas.client.connected) {
        const qos = 0;
        tas.client.subscribe(topic, {qos}, (error) => {
            if (error) {
                console.log('Subscribe to topics error', error)
                return;
            }

            console.log('Subscribe to topics (', topic, ')');
        });
    }
};

let doUnSubscribe = (topic) => {
    if (tas.client.connected) {
        tas.client.unsubscribe(topic, error => {
            if (error) {
                console.log('Unsubscribe error', error)
            }

            console.log('Unsubscribe to topics (', topic, ')');
        });
    }
};

let doPublish = (topic, payload) => {
    if (tas.client.connected) {
        tas.client.publish(topic, payload, 0, error => {
            if (error) {
                console.log('Publish error', error)
            }
        });
    }
};

let destroyConnection = () => {
    if (tas.client.connected) {
        try {
            if(Object.hasOwnProperty.call(tas.client, '__ob__')) {
                tas.client.end();
            }
            tas.client = {
                connected: false,
                loading: false
            }
            console.log('Successfully disconnected!');
        }
        catch (error) {
            console.log('Disconnect failed', error.toString())
        }
    }
};

createConnection();
