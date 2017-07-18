require('dotenv').config()

const express = require('express');
var session = require('cookie-session')

const app = express();
app.set('trust proxy', 1)
app.set('port', (process.env.PORT || 5000));

app.use(session({ secret: process.env.SESS_SECRET, cookie: { maxAge: 2592000 }}))


var twitterAPI = require('node-twitter-api');

var twitter = new twitterAPI({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callback: process.env.CALLBACK_URL
});

app.get('/', (req, res) => {
	res.send("Hello!");
});

app.get('/oauth/request_token', (req, res) => {
	
	var sess = req.session;
	sess.consumer_key = process.env.CONSUMER_KEY;
	sess.consumer_secret = process.env.CONSUMER_SECRET;
	sess.state = req.query.state;
	sess.client_id = req.query.client_id;
	sess.redirect_uri = req.query.redirect_uri;
	
	twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
		if (error) {
			console.log("Error getting OAuth request token : ");
			console.log(error);
		} else {
			
			sess.request_token = requestToken;
			sess.request_token_secret = requestTokenSecret;
				
			res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+requestToken);
		}
	});
  
});


app.get('/oauth/callback', (req, res) => {
	var sess = req.session;
	
	requestToken = sess.request_token;
	requestTokenSecret = sess.request_token_secret;
	oauth_verifier =  req.query.oauth_verifier;
	
	twitter.getAccessToken(requestToken, requestTokenSecret, oauth_verifier, function(error, accessToken, accessTokenSecret, results) {
		if (error) {
			console.log(error);
		} else {

			params = {};
			twitter.verifyCredentials(accessToken, accessTokenSecret, params, function(error, data, response) {
			if (error) {
				console.log("Error while verifying.");
				res.send("Error while verifying.");
			} else {
			
				console.log("Success; name:"+data["screen_name"]);
				
				var redirect_alexa = decodeURI(sess.redirect_uri)+
				"#access_token="+accessToken+","+accessTokenSecret+
				"&state="+sess.state+
				"&client_id="+sess.client_id+
				"&response_type=Bearer";
				
				console.log(redirect_alexa);
				
				res.redirect(redirect_alexa);
				
			}
		});
		}
	});
});

  
app.listen(app.get('port'), () => {
  console.log('Express server started on port 5000');
});

