const passport = require('passport');
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;

module.exports = function(app, myDataBase){
    // passport serializeUser and deserializeUser: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
  passport.serializeUser((user, done) => { // determines which data of the user object should be stored in the current user session
    done(null, user._id); // saved to session, req.session.passport.user = {id: '...'}
  });
  
  passport.deserializeUser((id, done) => { // id is teh key here that is used to retrieve the user object
    myDataBase.findOne({_id: new ObjectID(id)}, (error, doc) => {
      done(null, doc); // the doc (user)
    });
  });
  
  passport.use(new LocalStrategy((username, password, done) => { // the process when we try to authenticate a user locally (the authentication strategy)
    myDataBase.findOne({username: username}, (error, user) => 
      {
        console.log('User ' + username + ' attempted to log in.');
        if (error) {return done(error)}
        if (!user) {return done(null, false)}
        if (!bcrypt.compareSync(password, user.password)) {return done(null, false)}
        return done(null, user);
      });
    }
  ));

  passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://boilerplate-advancednode.limfuo.repl.co/auth/github/callback'
  }, (accessToken, refreshToken, profile, cb) => { // profile contains the authenticate user's GitHub profile, while the cb is a callback provided to the user to complete their authentication
    console.log(profile);
    myDataBase.findOneAndUpdate(
      {id: profile.id},
      {
        $setOnInsert: {
          id: profile.id,
          name: profile.displayName || 'John Doe',
          photo: profile.photos[0].value || '',
          email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
          created_on: new Date(),
          provider: profile.provider || ''
        },
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },
      {upsert: true, new: true},
      (error, doc) => {
        return cb(null, doc.value);
      }
    );
    }
  ));
}