//= require jquery
//= require moment
//= require handlebars
//= require ember
//= require ember-data
//= require ember-localstorage-adapter
//= require_self
//= require_tree ./templates
//= require_tree ./views
FF = Ember.Application.create({
  LOG_TRANSITIONS: true
});

FF.LSAdapter = DS.LSAdapter.extend({
  namespace: 'FF'
});

FF.ApplicationAdapter = FF.LSAdapter;

FF.Router.map(function() {
  this.resource('welcome', { path: '/' });
  this.resource("history");
  this.resource("task");
});

FF.CurrentUser = DS.Model.extend({
  name: DS.attr('string')
});

FF.Task = DS.Model.extend({
  type: DS.attr('string'),
  text: DS.attr('string', {defaultValue: ""}),
  isConfirmed: DS.attr('boolean'),
  createdAt: DS.attr('date'),
  completedAt: DS.attr('date'),

  isDoTask: function() {
    return this.get('type') === 'do';
  }.property('type'),

  isCreatedToday: function() {
    var createdAt = moment(this.get('createdAt'));
    return createdAt.isAfter(moment().startOf('day')) && createdAt.isBefore(moment().endOf('day'))
  }.property('createdAt')
});

FF.WelcomeRoute = Ember.Route.extend({
  actions: {
    createDoTask: function() {
      var task = this.store.createRecord('task', {
        type: 'do'
      });
      task.save();
      this.transitionTo('task');
    },
    createDontTask: function() {
      var task = this.store.createRecord('task', {
        type: 'dont'
      });
      this.transitionTo('task', task);
    }
  },

  beforeModel: function() {
    var task = this.modelFor('task');
    if(task) {
      this.transitionTo('task');
    }
  },

  exit: function() {
    this.get('controller.currentUser').save();
  },

  setupController: function(controller, model) {
    var store = this.store;

    store.find('currentUser').then(function(result) {
      var user = result.get('content')[0];
      if(!user) {
        user = store.createRecord('currentUser');
      }
      controller.set('currentUser', user);
    });
  }
});

FF.TaskRoute = Ember.Route.extend({
  actions: {
    confirmTask: function() {
      var task = this.modelFor('task');
      task.set('createdAt', new Date());
      task.set('isConfirmed', true)
      task.save();
    }
  },

  model: function() {
    return this.store.find('task', { completedAt: null }).then(function (result) {
      var task;
      if(result) {
        task = result.get('content')[0];
      }
      return task;
    });
  },

  afterModel: function(model) {
    if(!model) {
      this.transitionTo('welcome');
    }
  }
})

FF.TimeController = Ember.Controller.extend({

  ticking: false,

  init: function() {
    if(!this.get('ticking')) {
      this.set('ticking',true);
      this.tick();
    }
  },

  tick: function () {
    this.notifyPropertyChange('untilMidnight');
    setTimeout(this.tick.bind(this), 1000)
  },

  untilMidnight: function() {
    var untilMidnight = new Date(),
      now  = untilMidnight.getTime();
    untilMidnight.setHours( 24 );
    untilMidnight.setMinutes( 0 );
    untilMidnight.setSeconds( 0 );
    untilMidnight.setMilliseconds( 0 );
    return untilMidnight - now;
  }.property(),

  timer: function() {
    return moment.utc( this.get("untilMidnight") ).format("HH:mm:ss")
  }.property("untilMidnight")
})

FF.WelcomeController = Ember.Controller.extend({
  currentUser: null,

  needs: ['time'],

  timerBinding: 'controllers.time.timer'
})

FF.TaskController = Ember.ObjectController.extend({
  needs: ['time'],

  timerBinding: 'controllers.time.timer',
  untilMidnightBinding: 'controllers.time.untilMidnight',

  isAgreedable: function() {
    return !this.get('isConfirmed') && (this.get('text').length > 3);
  }.property('text', 'isConfirmed')
})

Ember.TextArea.reopen({
  attributeBindings: ['tabindex','autofocus',"spellcheck","rows","maxChars"],
  didInsertElement: function() {
    /* Set cursor on end */
    var temp;
    temp=$('textarea').val();
    $('textarea').val('');
    $('textarea').focus();
    $('textarea').val(temp);
  },
  keyDown: function (e) {
    if(e.which == 13) {
      return false
    }
  },
  keyUp: function(e) {
    var limit = 50;
    var elem = $('textarea');
    //get the current text inside the textarea
    var text = elem.val();
    //count the number of characters in the text
    var chars = text.length;

    //check if there are more characters then allowed
    if(chars > limit){
      //and if there are use substr to get the text before the limit
      var new_text = text.substr(0, limit);

      //and change the current text with the new text
      elem.val(new_text);
    }
  }
})