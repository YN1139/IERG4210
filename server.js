 const express = require('express');
 const path = require('path');
 const app = express();
 const port = 3000;
// const __dirname = '/var/www/IERG4210/';
/*app.get('/',function(req, res) {
 res.send('IERG4210 Testing!');
 });*/

 app.use('/', (req, res) => {
	res.sendFile(path.join(__dirname,'index.html'));
	console.log('Homepage loaded.');
 });


 app.listen(port, function() {
 console.log(`Server running at port ${port}`);
 })

//from tutorial slide, for testing purpose only
