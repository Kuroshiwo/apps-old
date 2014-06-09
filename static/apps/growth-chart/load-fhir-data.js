window.GC = window.GC || {};

GC.get_data = function() {
  var dfd = $.Deferred();

  FHIR.oauth2.ready(function(smart){

    var hidePatientHeader = (smart.state.preferences === 'hidePatientHeader');
    GC.Preferences.prop("hidePatientHeader", hidePatientHeader);

    var patient = smart.context.patient;

    var vitalsFetch = $.Deferred();
    var ptFetch = patient.read();

    patient.Observation.where.
      nameIn(['3141-9', '8302-2', '8287-5', '39156-5']).
      drain(drainVitals).done(doneVitals);

    var allVitals = [];
    function drainVitals(vs){
      [].push.apply(allVitals, vs); 
    };
    
    function doneVitals(){
        vitalsFetch.resolve(smart.byCode(allVitals, 'name'));
    };

    $.when(ptFetch, vitalsFetch).done(onData);

    function onData(patient, vitalsByCode){

      var t0 = new Date().getTime();

      // Initialize an empty patient structure
      var p = {
        demographics: { },
        vitals:{
          lengthData: [],
          weightData: [],
          BMIData: [],
          headCData: []
        }
      };

      // For debugging/exploration, a global handle on the output
      console.log("Check out the parsed FHIR data: window.patient, window.vitalsByCode");
      window.patient = patient;
      window.vitalsByCode = vitalsByCode

      var fname = patient.name[0].given.join(" ");
      var lname = patient.name[0].family.join(" ");
      p.demographics.name = fname + " " + lname;
      p.demographics.birthday = patient.birthDate;
      p.demographics.gender = (patient.gender.coding[0].code == 'M' ? 'male' : 'female');

      var units = smart.units;
      process(vitalsByCode['3141-9'], units.kg, p.vitals.weightData);
      process(vitalsByCode['8302-2'],  units.cm,  p.vitals.lengthData);
      process(vitalsByCode['8287-5'],  units.cm,  p.vitals.headCData);
      process(vitalsByCode['39156-5'], units.any, p.vitals.BMIData);

      function process(observationValues, toUnit, arr){
        observationValues && observationValues.forEach(function(v){
          arr.push({
            agemos: months(v.appliesDateTime, patient.birthDate),
            value: toUnit(v.valueQuantity)
          })
        });
      };

      function months(d){
        return -1 * new XDate(d).diffMonths(new XDate(p.demographics.birthday));
      }

      window.data = p;
      console.log("Check out the patient's growth data: window.data");
      dfd.resolve(p);
    }
  });

  return dfd.promise();
};
