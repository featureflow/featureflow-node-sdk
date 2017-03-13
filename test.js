const Featureflow = require('./index');

// const SERVER_API_KEY = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI1ODk4Mjk2ZjNjNDUwZTAwMGFiODExNDIiLCJhdXRoIjoiUk9MRV9FTlZJUk9OTUVOVCJ9.x5_E2vGz17PjuTH20bV5VD4iuJqHFU1RFgaZl8ZX8xxktN9YOiCZDP4_jU5WeQDywTuw0fZWEygM-SejCQCh2A';
// const RTM_URL = undefined;

const SERVER_API_KEY = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI1OGJmMzBkYjMwOWU1MTRmZmNkOWVjZjMiLCJhdXRoIjoiUk9MRV9FTlZJUk9OTUVOVCJ9.dZjNtxLe3lssTb3v_Kw3WNJFTyPDG_2CG4LyC9UnlzfjpXy8ICR2tZ1h5733Niah4jkPAN1b--QdlNb1jlO2PQ';
const RTM_URL = 'http://10.10.2.60:7999';


Featureflow.init(SERVER_API_KEY, {rtmUrl: RTM_URL}, function(err, featureflow){
  console.log(featureflow.evaluate('alpha').isOn());

  featureflow.on('features.updated', features=>{
    console.log(features);
  })
});