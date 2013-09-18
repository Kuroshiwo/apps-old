angular.module('fhirStarter').factory('fhirSettings', function($rootScope) {

  var servers = [{
    name: 'SMART on FHIR (fhir.me)',
    serviceUrl: 'https://api.fhir.me',
    auth: {
      type: 'basic',
      username: 'client',
      password: 'secret'
    }
  }, {
    name: 'Health Intersections Server (Grahame)',
    serviceUrl: 'http://hl7connect.healthintersections.com.au/svc/fhir',
    auth: {
      type: 'none'
    }
  }, {
    name: 'Furore Server (Ewout)',
    serviceUrl: 'http://spark.furore.com/fhir',
    auth: {
      type: 'none'
    }
  }, {
    name: 'Local FHIR dev server',
    serviceUrl: 'http://localhost:9090',
    auth: {
      type: 'basic',
      username: 'client',
      password: 'secret'
    }
  }, {
    name: 'Local FHIR Tomcat server',
    serviceUrl: 'http://localhost:8080/fhir-server',
    auth: {
      type: 'basic',
      username: 'client',
      password: 'secret'
    }
  }];

  var settings = localStorage.fhirSettings ? 
  JSON.parse(localStorage.fhirSettings) : servers[0];

  return {
    servers: servers,
    get: function(){return settings;},
    set: function(s){
      console.log("set called on", s);
      settings = s;
      localStorage.fhirSettings = JSON.stringify(settings);
      $rootScope.$emit('new-settings');
    }
  }

});

angular.module('fhirStarter').factory('patientSearch', function($rootScope, $q, fhirSettings) {

  var fhir;

  function  setup(){
    console.log("Create new fhir client object", fhirSettings.get());
    fhir = new FhirClient(fhirSettings.get());
  }

  setup();

  $rootScope.$on('new-settings', function(e){
    setup()
  });


  var currentSearch;
  var pages = [];
  var atPage;

  return {
    atPage: function(){
      return atPage;
    },

    search: function(p){
      d = $q.defer();
      fhir.search({
        resource: 'patient',
        searchTerms: {name: p.tokens.map(function(t){return '"'+t+'"'}), sort: "family"},
        count: 10
      }).done(function(r, search){
        currentSearch = search;
        atPage = 0;
        pages = [r];
        d.resolve(r)
        $rootScope.$digest();
      }).fail(function(){
        console.log(arguments);
        alert("Search failed.");
      });
      return d.promise;
    },

    previous: function(p){
      atPage -= 1;
      return pages[atPage];
    },

    next: function(p){
      atPage++;

      d = $q.defer();

      if (pages.length > atPage) {
        d.resolve(pages[atPage]);
      } else {

        currentSearch.next().done(function(r){
          pages.push(r);
          d.resolve(r);
          $rootScope.$digest();
        });
      }

      return d.promise;
    },
    getOne: function(pid){
      // If it's already in our resource cache, return it.
      // Otherwise fetch a new copy and return that.
      d = $q.defer();
      var p = fhir.resources.get({resource:'patient', id:pid});
      if (p !== null) {
        d.resolve(p);
        return d.promise;
      }
      fhir.get({resource: 'patient', id: pid})
      .done(function(p){
        d.resolve(p);
        $rootScope.$digest();
      });
      return d.promise;
    }  
  };
});

angular.module('fhirStarter').factory('patient', function() {
  return {
    id: function(p){
      return p.resourceId;
    },
    name: function(p){
      var name = p && p.name && p.name[0];
      if (!name) return null;

      return name.given.join(" ") + " " + name.family.join(" ");
    }
  };
});

angular.module('fhirStarter').factory('user', function() {
  return {
    getPatients: function(){
      return $.ajax({
        url:publicUri+"/internal/getPatients/"+user._id, 
        dataType:"json"
      });
    },
    getAuthorizations: function(){
      return $.ajax({
        url:publicUri+"/internal/getAuthorizations/"+user._id, 
        dataType:"json"
      });
    }
  };
});

angular.module('fhirStarter').factory('app', ['$http',function($http) {
  return {
    getApps: function(){
      return [
        {
          "client_name": "Cardiac Risk",
          "launch_uri": "./apps/cardiac-risk/launch.html",
          "logo_uri": "http://smartplatforms.org/wp-content/uploads/2012/09/cardiac-risk-216x300.png"
        }, {
          "client_name": "Growth Chart",
          "launch_uri": "./apps/growth-chart/launch.html",
          "logo_uri": "http://smartplatforms.org/wp-content/uploads/pgc-male-healthyweight-os.png"
        }, {
          "client_name": "BP Centiles",
          "launch_uri": "./apps/bp-centiles/launch.html",
          "logo_uri": "http://vectorblog.org/wp-content/uploads/2012/09/BP-Centiles-screengrab-300x211.jpg"
        }
      ]
    }
  };
}]);


