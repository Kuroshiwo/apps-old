angular.module('fhirStarter').controller("MainController", 
  function($scope, $rootScope, $route, $routeParams, $location, fhirSettings){
    $scope.showing = {
      settings: false
    }
  }
);

angular.module('fhirStarter').controller("ErrorsController", 
  function($scope, $rootScope, $route, $routeParams, $location, fhirSettings){

    $scope.errors = [];
    $rootScope.$on('error', function(context, e){
      $scope.errors.push(e);
    })

    $scope.clearError = function(i){
      $scope.errors.splice(i,1);
    }
  });

  angular.module('fhirStarter').controller("SettingsController", 
    function($scope, $rootScope, $route, $routeParams, $location, fhirSettings){

      $scope.existing = { }
      $scope.settings = JSON.stringify(fhirSettings.get(),null,2);
      $scope.servers = fhirSettings.servers.map(function(server){
        return {
          value: JSON.stringify(server, null, 2),
          title: server.name
        }
      });

      $scope.save = function(){
        fhirSettings.set(JSON.parse($scope.settings));
        $scope.showing.settings = false;
      }

      $scope.oauth = function(){
        var client = {
          "client_name": "SMART FHIR Starter",
          "client_uri": "https://github.com/jmandel/fhir-starter",
          "logo_uri": "http://wiki.hl7.org/images/1/15/FHIR.png",
          "contacts": [ "info@smartplatforms.org" ],
          "redirect_uris": [window.location.origin + window.location.pathname],
          "response_types": ["token"],
          "grant_types": ["implicit"],
          "token_endpoint_auth_method": "none",
          "scope":  "fhir-complete"
        };

        var provider = {
          "name": "Local Testing Hospital",
          "description": "Just on a developer's machine",
          "url": "http://bbplus-ri.aws.af.cm",
          "oauth2": {
            "registration_uri": "http://bbplus-ri.aws.af.cm/register",
            "authorize_uri": "http://bbplus-ri.aws.af.cm/authorize",
            "token_uri": "http://bbplus-ri.aws.af.cm/token"
          },
          "bb_api":{
            "fhir_service_uri": "https://api.fhir.me"
          }
        };

        BBClient.authorize({client: client, provider: provider});
      }


    });

    angular.module('fhirStarter').controller("PatientViewWrapper",  
      function($scope, $routeParams, patientSearch) {
        $scope.loading = true;
        patientSearch.getOne($routeParams.pid).then(function(p){
          $scope.loading = false;
          $scope.patient = p;
        });
        $scope.patientId = function(){
          return $routeParams.pid;
        };
      }
    );

    angular.module('fhirStarter').controller("PatientSearchController",  
      function($scope, patient, patientSearch, $routeParams, $rootScope, $location) {

        $scope.onSelected = function(p){
          var pid = patient.id(p).id;
          var loc = "/ui/patient-selected/"+pid;
          if ($routeParams.q == $scope.searchterm) {
            return $location.url(loc); 
          }
          $location.search("q", $scope.searchterm);
          var off = $rootScope.$on("$routeUpdate", function(){
            $location.url(loc);
            off();
          });

        };

        $scope.setLoading = function(){
          $scope.patients = [];
          $scope.loading = true;
        };
        $scope.setLoading();


        $scope.patientHelper = patient;
        $scope.nPerPage = 10;
        $scope.genderglyph = {"F" : "&#9792;", "M": "&#9794;"};
        $scope.searchterm  = typeof $routeParams.q ==="string" && $routeParams.q || "";

        $rootScope.$on('new-settings', function(){
          $scope.getMore();
        })

        $scope.nextPage = function(){
          if (!$scope.hasNext()) return;
          $scope.setLoading();
          patientSearch.next().then(function(p){
            $scope.loading = false;
            $scope.patients = p;
          });
        };

        $scope.previousPage = function(){
          if (!$scope.hasPrevious()) return;
          $scope.patients = patientSearch.previous();
        };

        $scope.select = function(i){
          $scope.onSelected($scope.patients[i]);
        };


        $scope.hasPrevious = function(){
          return patientSearch.atPage() > 0
        };

        $scope.hasNext = function(){
          return $scope.patients.length === $scope.nPerPage;
        };

        $scope.$watch("patients", function(p){
          var nBlanks = $scope.nPerPage - $scope.patients.length;
          $scope.blanks = [];
          for (var i=0; i<nBlanks; i++){
            $scope.blanks.push("blankline"); 
          }
        });

        $scope.$watch("searchterm", function(){
          var tokens = [];
          ($scope.searchterm || "").split(/\s/).forEach(function(t){
            tokens.push(t.toLowerCase());
          });
          $scope.tokens = tokens;
          $scope.getMore();
        });

        var loadCount = 0;
        var search = _.debounce(function(thisLoad){
          patientSearch.search({
            "tokens": $scope.tokens, 
            "limit": $scope.nPerPage
          }).then(function(p){
            if (thisLoad < loadCount) {
              return;
            }
            $scope.loading = false;
            $scope.patients = p;
          });
        }, 300);

        $scope.getMore = function(){
          $scope.setLoading();
          search(++loadCount);
        };

      });


      angular.module('fhirStarter').controller("PatientViewController", function($scope, patient, app, patientSearch, $routeParams, $rootScope, $location, fhirSettings) {
        $scope.all_apps = app.getApps();
        $scope.patientHelper = patient;
        $scope.fhirServiceUrl = fhirSettings.get().serviceUrl

        $scope.givens = function(name) {
          return name && name.givens.join(" ");
        };

      });
