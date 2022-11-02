const passport = require('passport');
const bcrypt = require('bcrypt');

const loginPug = process.cwd() + '/views/pug/index';
const profilePug = process.cwd() + '/views/pug/profile';
const chatPug = process.cwd() + '/views/pug/chat';

module.exports = function (app, myDataBase) {
  app.route('/')
    .get((req, res) => {
      res.render(loginPug, {
        title: 'Connected to Database',
        message: 'Please login',
        showLogin: true,
        showRegistration: true,
        showSocialAuth: true
      });
    });
  
  app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
    if (req.user){ // if the authentication middleware passes
      res.redirect('/profile');
    }
  });

  app.route('/profile')
    .get(ensureAuthenticatedMiddleware, (req, res) => {
      res.render(profilePug, {
        username: req.user.username
      });
    });
  
  app.route('/logout')
    .get((req, res) => {
      req.logout(); // unauthenticates the current user
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({username: req.body.username}, (error, user) => {
        if (error){
          next(error);
        }
        else if (user){ // if the user already exists, redirect back to the home page
          res.redirect('/');
        }
        else{ // if the user does not already exist
          const hash = bcrypt.hashSync(req.body.password, 12); // the encrypted password
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          }, (error, doc) => {
            if (error){
              res.redirect('/');
            }
            else{
              next(null, doc.ops[0]); // the newly inserted document is held within the ops property of doc
            }
          });
        }
      });
    }, passport.authenticate('local', {failureRedirect: '/'}), (req, res, next) => { // called after registering the new user
       res.redirect('/profile');
    }
  );

  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', {failureRedirect: '/'}), (req, res) => {
      if (req.user){
        req.session.user_id = req.user.id
        res.redirect('/chat');
      }
    });

  app.route('/chat')
  .get(ensureAuthenticatedMiddleware, (req, res) => {
    if (req.user){
      res.render(chatPug, {user: req.user});
    }
  });

  app.use((req, res, next) => { // to handle missing pages (status 404)
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}

function ensureAuthenticatedMiddleware(req, res, next){
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect('/'); // if the user is not authenticated, redirect to the root directory
};