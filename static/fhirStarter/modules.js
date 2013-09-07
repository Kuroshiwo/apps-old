angular.module('fhirStarter', ['ngSanitize'], function($routeProvider, $locationProvider){

  $routeProvider.when('/ui/select-patient', {
    templateUrl:'/static/fhirStarter/templates/select-patient.html',
    reloadOnSearch:false
  }) 

  $routeProvider.when('', {redirectTo:'/ui/select-patient'});

  $routeProvider.when('/ui/patient-selected/:pid', {
    templateUrl:'/static/fhirStarter/templates/patient-selected.html',
  });

  $routeProvider.when('/ui/authorize', {
    templateUrl:'/static/fhirStarter/templates/authorize-app.html',
  });

  $locationProvider.html5Mode(false);

});
