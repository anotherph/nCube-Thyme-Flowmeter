/**
 * Created by ryeubi on 2015-08-31.
 * Updated 2017.03.06
 * Made compatible with Thyme v1.7.2
 */

const mqtt = require('mqtt');
const {nanoid} = require('nanoid');
const {SerialPort} = require('serialport');

/* USER CODE */
// for sensor
let flowmeterPort = null;
// let flowmeterPortNum = 'COM1';
let flowmeterPortNum = '/dev/ttyS0';
let flowmeterBaudrate = '9600';

let tas = {
    client: {
        connected: false,
    },

    connection: {
        host: '127.0.0.1',
        port: 1883,
        endpoint: '',
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 30000,
        queueQoSZero: false,
        clientId: 'tas_' + nanoid(15),
        username: 'keti_thyme',
        password: 'keti_thyme',
    },
};

let sendDataTopic = {
    flowmeter: '/thyme/flowmeter',
};

// let recvDataTopic = {
//     led: '/led/set',
// };
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
        try {
            tas.client = mqtt.connect(connectUrl, options);

            tas.client.on('connect', () => {
                console.log(host, 'Connection succeeded!');

                tas.client.connected = true;
                tas.client.loading = false;

                // for(let topicName in recvDataTopic) {
                //     if(recvDataTopic.hasOwnProperty(topicName)) {
                //         doSubscribe(recvDataTopic[topicName]);
                //     }
                // }
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
                // if(topic === recvDataTopic.led) {
                //     // LED 제어
                // }
                /* */
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
            if (Object.hasOwnProperty.call(tas.client, '__ob__')) {
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

flowmeterPortOpening();

function flowmeterPortOpening() {
    if (!flowmeterPort) {
        flowmeterPort = new SerialPort({
            path: flowmeterPortNum,
            baudRate: parseInt(flowmeterBaudrate, 10),
        });
        flowmeterPort.on('open', flowmeterPortOpen);
        flowmeterPort.on('close', flowmeterPortClose);
        flowmeterPort.on('error', flowmeterPortError);
        flowmeterPort.on('data', flowmeterPortData);
    }
    else {
        if (flowmeterPort.isOpen) {
            flowmeterPort.close();
            flowmeterPort = null;
            setTimeout(flowmeterPortOpening, 2000);
        }
        else {
            flowmeterPort.open();
        }
    }
}

function flowmeterPortOpen() {
    console.log('flowmeterPort(' + flowmeterPort.path + '), flowmeterPort rate: ' + flowmeterPort.baudRate + ' open.');
}

function flowmeterPortClose() {
    console.log('flowmeterPort closed.');

    setTimeout(flowmeterPortOpening, 2000);
}

function flowmeterPortError(error) {
    console.log('[flowmeterPort error]: ' + error.message);

    setTimeout(flowmeterPortOpening, 2000);
}

let con = {};

function flowmeterPortData(data) {
    // console.log('Recieved ' + data.toString() + ' From RS232');

    // TODO: 유량계 단위 바꿔서 들어오는 데이터 확인.. 아래 내용 필요시 변경해야함
    let msg = data.toString();
    let msg_arr = msg.split(' ');
    console.log(msg_arr);

    if (msg_arr.length === 2 || msg.includes('\x02')) {
        if (msg.includes('\x02')) {
            con.cur_time = msg.replace('\x02', '');
        }
        else {
            con.cur_time = msg;
        }
    }
    else if (msg.includes('ID')) {
        con.cur_time = con.cur_time + msg_arr[0];
        con.m_flowrate = msg_arr[msg_arr.length - 1];
    }
    else if (msg.includes('To')) {
        con.m_flowrate = con.m_flowrate + msg_arr[0];
        con.m_speed = msg_arr[1];
    }
    else if (msg.includes('t=')) {
        con.t_flowrate = msg.split('=')[1].replaceAll(' ', '');

        console.log(con);
        doPublish(sendDataTopic['flowmeter'], JSON.stringify(con));
        con = {};
    }
}
