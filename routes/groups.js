var User = require('../models/user');
var Group = require('../models/group');
var api = require('../api');

/*
 * GET users listing.
 */

// this should be replaced with a group
access_admin = function(req, res, next) {
	admins = ["mp3255","lmr439","bmb351"]
		
	if( req.user == undefined )
	{
		res.redirect(  process.env.base_url + '/auth/start?next=' + process.env.base_url + req.url );
	}
	else if( admins.indexOf( req.user.netID) == -1)
	{
		res.redirect(  process.env.base_url );
	}
	else
	{
		next();
	}
}

exports.list = {
	gui: [
		access_admin,
		function( req, res ) {
			Group.find({}, function( err, groups ) {
				if( err )
				{
					res.send( err );
				}
				else
				{
					res.render('groups_list', {
						title: 'Passport Groups',
						groups: groups
					});
				}
			});
		}
	]
}

exports.view = {
	gui: [
		access_admin,
		function( req, res ) {
			Group.findOne( {slug: req.params.slug }, function( err, group ) {
				if( err )
				{
					res.send( err );
				}
				else
				{
					group.members( {}, function( err, members ) {
						if( err )
						{
							res.send( err );
						}
						else
						{
							res.render('group_view', {
								title: group.name,
								members: members,
								group: group
							});
						}
					});
				}
			});
		}
	]
}

exports.new = {
	api: [
		api.auth, // authenticated
		// api call for permission
		function( req, res )
		{
			if( !api.can( 'groups.add', req.authInfo.scopes ) ) // can add groups
			{
				res.send('Unauthorized');
			}
			else
			{
				Group.newGroup( req.query.name, req.query.slug, function( group ) {
					res.send( group );
				});
			}
		}
	],
	gui: [
		access_admin,
		function( req, res ) {
			Group.newGroup( req.body.name, req.body.slug, function( group ) {
				res.redirect( group.url.view );
			});
		}
	],
}

exports.add = {
	gui: [
		access_admin,
		function( req, res ) {
			Group.findOne( {slug: req.params.slug }, function( err, group ) {
				if( err )
				{
					res.send( err );
				}
				else
				{
					ids = req.body.netids;
					ids = ids.split('\r\n');
					
					ids.forEach( function( id ) {
						User.findOneAndUpdate( { netID: id }, { $push: { groups: group.slug } }, { upsert: true }, function( err, us ) {
							
						} );
					});
					
					res.redirect( group.url.view );
				}
			});
		}
	],
	api: [
		api.auth, // authenticated
		// api call for permission
		function( req, res )
		{			
			if( !api.can( 'groups.manage', req.authInfo.scopes ) ) // can add groups
			{
				res.send('Unauthorized');
			}
			else
			{
				slug = req.query.slug;
				netID = req.query.netid;
				admin = req.query.admin;
				
				User.findOne( {netID: netID}, function( err, user ) {
					if( user.groups.indexOf( slug ) == -1 )
					{
						user.groups.push( slug );
						user.save( function( err, user ) {
							api.respond(res, {
								"message": "Added as a member",
								"code": "group.add.success"
							});
						});
					}
					else
					{
						api.respond(res, {
							"message": "Already a member",
							"code": "group.add.already"
						});
					}
					
					
					
					Group.findOne( { slug: slug }, function( err, group ) {
						// make sure that group exists
						if( group == null )
						{
							if( api.can( 'groups.add', req.authInfo.scopes ) )
							{
								Group.newGroup( null, req.query.slug, function( group ) {
									if( admin )
									{
										group.admins.push( netID );
										group.update( function( err, group ) {

										});
									}
								});
							}
						}
						else
						{
							if( admin )
							{
								group.admins.push( netID );
								group.update( function( err, group ) {

								});
							}
						}
					});
					
				});
				
				// Group.findOne( {slug: req.query.slug}, function( err, group ) {
				// 						if( err )
				// 						{
				// 							res.send( err );
				// 						}
				// 						else
				// 						{
				// 							
				// 							res.send( group );
				// 						}
				// 					});
			}
		}
	]
}

exports.remove = {
	gui: [
		access_admin,
		function( req, res ) {
			Group.findOne( {slug: req.params.slug }, function( err, group ) {
				if( err )
				{
					res.send( err );
				}
				else
				{
					User.findOne( {netID: req.query.netid }, function( err, user ) {
						if( err )
						{
							res.send( err );
						}
						else
						{
							group.removeUser( user, function( err, user ) {
								res.redirect( group.url.view );
							});
						}
					});
				}
			});
		}
	]
}