var Provider = require('../models/provider');

exports.start = function(req, res){
	if( req.query.next != undefined )
	{
		// set where they should continue onto
		req.session.next = req.query.next;
	}
		
	// here we redirect to the NYU login and onto the nyu login step here
	var redirect = process.env.base_url + '/auth/google';
	res.redirect( redirect );
};

exports.finish = function(req, res){
	if( req.session.gscopes != undefined )
	{		
		Provider.findOneAndUpdate( { provider: 'google', netID: req.user.netID, scopes: { "$size": 0 } }, { 'scopes': req.session.gscopes }, function( err ) {
			// req.session.gscopes = null;
		} );
	}
		
	// pass people along to their final destination
	if( req.session.next != undefined )
	{
		// also take this opportunity to store scopes with any Google access tokens generated		
		// send to next, if set
		res.redirect( req.session.next );
	}
	else
	{
		// otherwise, send home
		res.redirect( process.env.base_url );
	}
};

exports.nyu = function(req, res){
	var redirect = process.env.base_url + '/auth/google';
	res.redirect( redirect );
	// we no longer need to redirect more
	// 
	// // this intermediary step uses a frame to ensure the NYU token has been passed along to Google
	// // it then redirects, via Javascript, to the Google authentication step
	// res.render("auth_nyu", {
	// 	title: "Authentication...",
	// 	next: process.env.base_url + '/auth/google'
	// });
};

exports.fail = function(req,res){	
	res.render("auth_fail", {
		title: "Authentication failed",
		next: process.env.base_url + '/auth/start'
	});
}

exports.logout = function( req, res ) {
	req.logout();
	
	if( req.query.next != undefined )
	{
		// set where they should continue onto
		next = req.query.next;
	}
	else
	{
		next = 'https://start.nyu.edu';
	}
	
	res.render("auth_logout", {
		title: "Logging out",
		google: 'https://accounts.google.com/logout',
		next: next
	});
}