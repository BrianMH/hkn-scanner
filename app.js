var express = require('express');
var app = express();
var session = require('express-session'); 
var bodyParser = require('body-parser');

var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');


// Get spreadsheet  
// spreadsheet key is the long id in the sheets URL
// DEBUG: HAS BEEN REPLACED WITH FAKE COPY OF HKN LIST
var doc = new GoogleSpreadsheet('1EHSV709D97kJ1pj-Hs--qyzK2JWtYUFfJ1QxDflpMHM');
var sheet;

var itemSheet; 
var logSheet; 

var itemRows; 
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

/*
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1NZJc2oPN9o_qWQq6CV7yCYGrmGwujlqfhEnhTBHTNKo');
var sheet;

async.series([
  function setAuth(step) {
    // see notes below for authentication instructions!
    var creds = require('./google-generated-creds.json');
    // OR, if you cannot save the file locally (like on heroku)
    var creds_json = {
      client_email: 'yourserviceaccountemailhere@google.com',
      private_key: 'your long private key stuff here'
    }

    doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: '+info.title+' by '+info.author.email);
      sheet = info.worksheets[0];
      console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
      step();
    });
  },
*/
//var loginMessage = "null"; 
//var registerMessage = "null"; 

/*
 * Setup the webserver. 
 * Format routing. 
 */
app.use(express.static('public'));
app.use(session({secret: 'hknsecret'})); 
app.get('/hknscan.html', function (req, res) {
    console.log("loaded login page"); 
    if(req.session.username){
    console.log(req.session.username); 
        res.redirect("/buy.html" ); 
    } 
    else {
        res.sendFile( __dirname + "/" + "hknscan.html" );
    } 
})
app.get('/buy.html', function (req, res) {
    console.log("loaded buy page"); 
    if ( typeof req.session.username !== 'undefined' && req.session.username ){

        res.sendFile( __dirname + "/" + "buy2.html" );
    } 
    else { 
      res.redirect('/hknscan.html'); 
    } 
}); 
app.get('/buy2.html', function (req, res) {
    console.log("loaded buy2 page"); 
    if ( typeof req.session.username !== 'undefined' && req.session.username ){

        res.sendFile( __dirname + "/" + "buy2.html" );
    } 
    else { 
      res.redirect('/hknscan.html'); 
    } 
}); 

app.get('/credit.html', function (req, res) {
    console.log("loaded credit page"); 
    if ( typeof req.session.username !== 'undefined' && req.session.username ){

        res.sendFile( __dirname + "/" + "credit.html" );
    } 
    else { 
      res.redirect('/hknscan.html'); 
    } 
}); 

app.get('/', function (req, res) {
    //res.send('Hello World');
    res.sendFile( __dirname + "/" + "hknscan.html" ); 
}); 

app.get('/current_user', function (req, res) { 
    res.send(req.session.username); 
});  

app.get('/current_id', function (req, res) {
    res.send(req.session.user_id); 
}); 

app.get('/current_balance', function (req, res) { 
    sheet.getRows({
      offset: 1,
    //  limit: 20,
    //  orderby: 'col2'
    }, function( err, rows ){
        console.log("userindex: "+req.session.userindex); 
        console.log("debt-credit: "+rows[req.session.userindex]['debt-credit']); 
        req.session.balance = rows[req.session.userindex]['debt-credit']; 
        console.log("first: "+req.session.balance); 
        res.send(req.session.balance); 
    });  
}); 

app.get('/login_status', function (req, res) { 
    console.log("sending login status: "+req.session.loginSuccess); 
    
    var responseObject = {
      "loginStatus": req.session.loginSuccess, 
      "loginMessage": req.session.loginMessage 
    }; 

    res.send(responseObject); 
}); 

app.get('/register_status', function (req, res) { 
    console.log("sending register status: "+req.session.registerSuccess); 
    
    var responseObject = {
      "registerStatus": req.session.registerSuccess, 
      "registerMessage": req.session.registerMessage 
    }; 

    res.send(responseObject); 
}); 

app.get('/buy_status', function (req, res) { 
    var responseObject = { 
      "buyStatus": req.session.buy_success, 
      "buyMessage": req.session.buy_message
    }; 

    res.send(responseObject); 
});  

app.get('/credit_status', function (req, res) { 
    var responseObject = { 
      "creditStatus": req.session.credit_success, 
      "creditMessage": req.session.credit_message
    }; 

    res.send(responseObject); 
});  

app.get('/logout', function (req, res) { 
    console.log("logging out"); 
    req.session.destroy(); 
    res.redirect("/"); 
}); 

app.get('/register', function (req, res) { 
    if(req.session.loginSuccess){
      req.session.user_id = null; 
      req.session.username = null; 
      req.session.userindex = null; 
      //req.session.loginSuccess = false; 
      console.log("manually clearing session"); 
    } 
    console.log("register with this id: "+req.session.user_id); 
    res.sendFile( __dirname + "/" + "register.html" ); 
}); 

app.get('/leaderDebt', function (req, res) { 

 
  //console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
  async.series([
    
    function checkUser(callback) { 
      sheet.getRows({
        offset: 1,
        limit: 3,
        orderby: 'debt-credit'
      }, function( err, rows ){
        //console.log(rows); 

        callback(null, rows); 
      });
    } 
  ], 
  function(err, results) { 
    results = results[0]; 
    if(err) { 
      debtMessage = '<p class="centerText">info unavailable</p>'; 
    } 
    else { 
      debtMessage = '<ol class="leaderBoard">'; 
      for(var i = 0; i < results.length; i++){
        if( parseFloat(results[i]['debt-credit']) < 0 ){ 
          debtMessage += "<li>"+results[i].username+" $"+results[i]['debt-credit']+"</li>"; 
        } 
      } 
      debtMessage += "</ol>"; 
    }

    res.send(debtMessage); 


     
    
  }); 
}); 

app.get('/leaderCredit', function (req, res) { 

  async.series([

    function checkUser(callback) { 
      sheet.getRows({
        offset: 1,
	limit: 3,
        orderby: 'debt-credit', 
        reverse: true
      }, function( err, rows ){
        //console.log(rows); 
        callback(null, rows); 
      });
    } 
  ], 
  function(err, results) { 
    results = results[0]; 
    if(err) { 
      creditMessage = '<p class="centerText">info unavailable</p>'; 
    } 
    else { 
      creditMessage = '<ol class="leaderBoard">'; 
      for(var i = 0; i < results.length; i++){
        if (parseFloat(results[i]['debt-credit']) >= 0 ) {
          creditMessage += "<li>"+results[i].username+" $"+results[i]['debt-credit']+"</li>"; 
        } 
      } 
      creditMessage += "</ol>"; 
    }

    res.send(creditMessage); 


     
    
  }); 
}); 
/*
 * Connect to google doc and get sheet. 
 */
async.series([
  function setAuth(step) {
    // see notes below for authentication instructions!
    var creds = require('./google-generated-creds.json');
    // OR, if you cannot save the file locally (like on heroku)
    var creds_json = {
      client_email: 'yourserviceaccountemailhere@google.com',
      private_key: 'your long private key stuff here'
    }

    doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: '+info.title+' by '+info.author.email);
      console.log("found "+info.worksheets.length+" worksheets")
      sheet = info.worksheets[0];
      console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);

      itemSheetIdx = 0; 
      logSheetIdx = 0; 
      for (var i=0; i < info.worksheets.length; i++){
        if(info.worksheets[i]['title'] == 'Food'){ 
          itemSheetIdx = i; 
        } 
        if(info.worksheets[i]['title'] == 'Log'){ 
          logSheetIdx = i; 
        } 
      }
      itemSheet = info.worksheets[itemSheetIdx]; 
      logSheet = info.worksheets[logSheetIdx]; 
      step();
    });
  }, 
  function getItemRows(step) { 
    itemSheet.getRows({
      offset: 1,
    }, function( err, rows ){
      
      itemRows = rows; 
      step()
    }); 
  } 
]); 

app.post('/check_item', urlencodedParser, function (req, res){ 
  var itemObject = {};   
  for(var i = 0; i < itemRows.length; i++){ 
    if(req.body.item === itemRows[i].barcode){
      console.log("found matching item"); 
      itemObject.name = itemRows[i].name; 
      itemObject.price = itemRows[i].price; 
    }
  } 

  res.send(itemObject); 
}); 
app.post('/process_signin', urlencodedParser, function (req, res) {
  console.log("process signin starting ..."); 
  // Prepare output in JSON format
  response = {
    userid:req.body.inputPassword
  };

  console.log("this is a sign response",response); 

  req.session.user_id = response.userid.toString().trim(); 
  async.series([
    function tryLogin(step) {
                                          
      // google provides some query options
      sheet.getRows({
        offset: 1,
      //  limit: 20,
      //  orderby: 'col2'
      }, function( err, rows ){
        console.log("rows.length: "+rows.length); 
        for (var i=0; i < rows.length; i++){
          console.log('Userid: '+rows[i].userid);
          console.log(rows[i]);
          if( response.userid.toString().trim() === rows[i].userid) { 
            console.log("found matching id"); 
            // console.log(rows[i]); 
            console.log(response.userid.toString().trim()); 
            console.log(rows[i].userid); 
            req.session.username = rows[i].username; 
            req.session.balance = rows[i]['debt-credit']; 
            req.session.userindex = i; 
            console.log("userindex: "+req.session.userindex); 
            req.session.loginSuccess = true; 
            console.log(req.session.loginSuccess); 
            res.redirect('/buy.html'); 
            return; 
          } 
        } 
        req.session.loginSuccess = false; 
        req.session.loginMessage = `<div class="alert alert-warning" role="alert"><strong>Error!</strong> Please try a different ID or create a new user below.</div><button id="createUser" type="button" class="btn btn-block btn-success">Create New User</button>`; 
 
        console.log(req.session.login_Success); 
        //console.log('session username: '+req.session.username); 
        
        //console.log('Read '+rows.length+' rows');
        res.redirect('/hknscan.html'); 
        //console.log(rows);

        // the row is an object with keys set by the column headers
        //rows[0].colname = 'new val';
        //rows[0].save(); // this is async

        // deleting a row
        //rows[0].del();  // this is async
        //  sheet.addRow({
        //      'userid': 23,
        //      'username': 'test',
        //      'debt-credit': 0
        //  }, function(err){
        //      console.log(err);
        //      });
        step();
      });
    }
 
  ]); 
  //res.end(JSON.stringify(response));
}); 

app.post('/process_registration', urlencodedParser, function (req, res) {
  console.log("process registration starting ..."); 

  // Prepare output in JSON format
  response = {
    userid:req.body.inputId, 
    username:req.body.inputName, 
    email:req.body.email,
    venmoName:req.body.venmoName,
    balance:req.body.inputBalance
  };

  /*
  req.session.user_id = response.userid.toString().trim(); 
  req.session.username = response.username.toString().trim(); 
  req.session.balance = response.balance.toString().trim(); 
  */
 
  async.series([

    function checkUser(callback) { 
      sheet.getRows({
        offset: 1,
      }, function( err, rows ){
        var err1 = null; 
        if (err) { 
          err1 = err; 
        } 
        else { 
          for (var i=0; i < rows.length; i++){
            if( response.userid.toString().trim() === rows[i].userid) { 
              err1 = "Error: Duplicate user id." 
            } 
          } 
        } 
        callback(err1, "success");  
      });

    }, 
    function tryRegister(callback) {
                                          
      sheet.addRow({
          'userid': response.userid.toString().trim(), 
          'username': response.username.toString().trim(),  
          'email': response.email.toString().trim(), 
          'venmoname': response.venmoName.toString().trim(),
          'debt-credit': response.balance.toString().trim()
      }, function(err){

        callback(err, "success"); 
          
      });
    }
 
  ], 
  function(err, results) { 
    if (err) { 
      req.session.registerSuccess = false; 
      req.session.registerMessage = `<div class="alert alert-danger" role="alert">Problem creating new user.<br> `+err+`</div>`
      res.redirect("/register"); 
    } 
    else { 
      req.session.loginSuccess = false; 
      req.session.registerSuccess = true; 
      req.session.loginMessage = `<div class="alert alert-success" role="alert"><strong>Success!</strong> New user created. Please login.</div>`

      res.redirect("/"); 
    } 
    
  }); 
  //res.end(JSON.stringify(response));
}); 

app.post('/process_buy', urlencodedParser, function (req, res) {
  console.log("process buy starting ... "); 

  console.log(req.body); 
  // Prepare output in JSON format

  // change to amount:req.body.amount for manual price
  response = {
    amount:req.body.total,
    items:req.body.itemsString
  };

  req.session.buy_success = false; 
  async.series([
    function workingWithRows(step) {
                                          
      //TODO: check if req.session.user_id is set
      console.log("user id is "+req.session.user_id); 
      if(typeof req.session.user_id == 'unefined' || req.session.user_id == null || req.session.user_id == '1234'){
        res.redirect("/"); 
        return; 
      }
      // TODO: validate response.amount and convert to float 
      console.log("response.amount: "+response.amount); 
      console.log("parseFloat(response.amount): "+parseFloat(response.amount)); 

      // google provides some query options
      sheet.getRows({
        offset: 1,
      //  limit: 20,
      //  orderby: 'col2'
      }, function( err, rows ){
        for (var i=0; i < rows.length; i++){
          if( req.session.user_id === rows[i].userid) { 
            console.log("found the purchasing user"); 
            var new_balance = parseFloat(rows[i]['debt-credit']) - parseFloat(response.amount); 
            console.log("new_balance: "+new_balance); 
            rows[i]['debt-credit'] = new_balance; 
            rows[i].save(); 
            req.session.buy_success = true; 
            req.session.buy_message = `<div class="alert alert-success" role="alert"><strong>Success!</strong> Your purchase is complete.</div>`; 
  

          } 
        } 

        if(!req.session.buy_success){
            req.session.buy_message = `<div class="alert alert-danger" role="alert"><strong>Error!</strong> There was a problem with your purchase. Please try again.</div>`; 
            err = "Error"; 

        } 

        //res.redirect('/buy.html'); 
        //return; 
        step(err, "success");
      });
    }, 

    function logPurchase(step) {
                                          
      //TODO: check if req.session.user_id is set
      logSheet.addRow({
          'name': req.session.username, 
          'items': response.items,
          'price': response.amount, 
          'timestamp': Date().toString() 
      }, function(err){

        step(err, "success"); 
          
      });


    }
 
  ], 
  
  function(err, results) { 
    if (err) { 
        req.session.buy_message = `<div class="alert alert-danger" role="alert"><strong>Error!</strong> There was a problem with your purchase. Please try again.</div>`; 
        res.redirect('/buy.html'); 
        return; 

    } 
    res.redirect('/logout'); 

         
    
  }); 
  
  //res.end(JSON.stringify(response));
}); 


app.post('/process_credit', urlencodedParser, function (req, res) {
  console.log("process credit starting ... "); 

  // Prepare output in JSON format
  response = {
    amount:req.body.amount
  };

  req.session.credit_success = false; 
  async.series([
    function workingWithRows(step) {
                                          
      //TODO: check if req.session.user_id is set

      if(typeof req.session.user_id == 'unefined' || req.session.user_id == null){
        res.redirect("/"); 
        return; 
      }
      // TODO: validate response.amount and convert to float 
      console.log("response.amount: "+response.amount); 
      console.log("parseFloat(response.amount): "+parseFloat(response.amount)); 

      // google provides some query options
      sheet.getRows({
        offset: 1,
      //  limit: 20,
      //  orderby: 'col2'
      }, function( err, rows ){
        for (var i=0; i < rows.length; i++){
          if( req.session.user_id === rows[i].userid) { 
            console.log("found the purchasing user"); 
            var new_balance = parseFloat(rows[i]['debt-credit']) + parseFloat(response.amount); 
            console.log("new_balance: "+new_balance); 
            rows[i]['debt-credit'] = new_balance; 
            rows[i].save(); 
            req.session.credit_success = true; 
            req.session.credit_message = `<div class="alert alert-success" role="alert"><strong>Success!</strong> Your account balance has been updated.</div>`; 
  

          } 
        } 

        if(!req.session.credit_success){
            req.session.credit_message = `<div class="alert alert-danger" role="alert"><strong>Error!</strong> There was a problem with updating your balance. Please try again.</div>`; 

        } 

        res.redirect('/credit.html'); 
        return; 
        step();
      });
    }
 
  ]); 
  //res.end(JSON.stringify(response));
})
var server = app.listen(1234, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)

})
