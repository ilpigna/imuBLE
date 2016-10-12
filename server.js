var app = require('http').createServer()
var io = require('socket.io')(app)


app.listen(8000)

//Bluetooth part
var noble = require('noble');
// These should correspond to the peripheral's service and characteristic UUIDs
var IMU_SERVICE_UUID = '2947ac9efc3811e586aa5e5517507c66';
var AX_CHAR_UUID =  '2947af14fc3811e586aa5e5517507c66';
var AY_CHAR_UUID = '2947b090fc3811e586aa5e5517507c66';
var AZ_CHAR_UUID = '2947b180fc3811e586aa5e5517507c66';
var GX_CHAR_UUID = '2947b252fc3811e586aa5e5517507c66';
var GY_CHAR_UUID = '2947b5aefc3811e586aa5e5517507c66';
var GZ_CHAR_UUID = '2947b694fc3811e586aa5e5517507c66';


noble.on('stateChange', function(state) {
  if(state === 'poweredOn') {
    console.log('Start BLE scan...')
    noble.startScanning([IMU_SERVICE_UUID], false);
  }
  else {
    console.log('Cannot scan... state is not poweredOn')
    noble.stopScanning();
  }
});

// Discover the peripheral's IMU service and corresponding characteristics
// Then, emit each data point on the socket stream
noble.on('discover', function(peripheral) {
  peripheral.connect(function(error) {
    console.log('Connected to peripheral: ' + peripheral.uuid);
    peripheral.discoverServices([IMU_SERVICE_UUID], function(error, services) {
      var imuService = services[0];
      console.log('Discovered IMU service');

      imuService.discoverCharacteristics([], function(error, characteristics) {
        characteristics.forEach(function(characteristic) {
          emitSensorData(characteristic);
          //IF I WANT TO PRINT THE READ VALUES TO TERMINAL
          //characteristic.on('read', function(data) {
          //  console.log(getSocketLabel(characteristic.uuid) + ': ' + data.readInt32LE(0));
          //});
          //characteristic.notify('true', function(error) { if (error) throw error; });
        });
      });
    });
  });
});


function getSocketLabel(uuid) {
  var label = null;

  if(uuid == AX_CHAR_UUID) {
    label = 'ax:';
  }
  else if(uuid == AY_CHAR_UUID) {
    label = 'ay:';
  }
  else if(uuid == AZ_CHAR_UUID) {
    label = 'az:';
  }
  else if(uuid == GX_CHAR_UUID) {
    label = 'gx:';
  }
  else if(uuid == GY_CHAR_UUID) {
    label = 'gy:';
  }
  else if(uuid == GZ_CHAR_UUID) {
    label = 'gz:';
  }

  return label;
}

//READ DATA FROM SENSORS
function emitSensorData(characteristic) {
    var socketLabel = getSocketLabel(characteristic.uuid);
    console.log(socketLabel);


  characteristic.on('read', function(data) {
    io.emit(socketLabel, data.readInt32LE(0));
  });

  characteristic.notify('true', function(error) { if (error) throw error; });

  }

  //hello world SENT TO client AND VISIBLE ON WEBBROWSER CONSOLE
  io.on('connection', function(socket) {
    socket.emit('alert', "hello from server")
    //SEND IMU DATA TO CLIENT
    socket.broadcast.emit("ax:",'ax:');
    socket.broadcast.emit("ay:",'ay:');
    socket.broadcast.emit("az:",'az:');
    socket.broadcast.emit("gx:",'gx:');
    socket.broadcast.emit("gy:",'gy:');
    socket.broadcast.emit("gz:",'gz:');

    //RECEIVE click client conneted from CLIENT AND PRINT TO TERMINAL
    socket.on('click', function(data) {
      console.log(data)
    })
  })
