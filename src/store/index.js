import Vue from 'vue'
import Vuex from 'vuex'
import widgets from './modules/widgets'
import patients from './modules/patients'
import layouts from './modules/layouts'
import VuexPersistence from 'vuex-persist'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'
const vuexLocal = new VuexPersistence ({
    key:"first",
    storage: window.localStorage,
    // reducer: state => ({patientlist: state.patientlist, currentStation: state.currentStation, currentGroup:state.currentGroup}),
})
export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  plugins: [vuexLocal.plugin],
  modules: {
    widgets,
    patients,
    layouts
  },
  state:{
      init:{},
      debugEnabled:true,
      filterEnabled:true,
      loggerURL:'http://localhost:3003/dashboardlog',
      currentStation:{id:-1,"label":""},
      currentGroup:{id:0,"color":"#0075bc"},
      currentPatientIndex: -1,
      patientlist:  [],
      maxgroupinuse:6,
      patientData:[]
    },
  mutations: {
    init(state, obj){
      state.init=obj;
      state.filterEnabled=state.init.filterenable;
      if(state.filterEnabled){
        state.currentStation.id=0;
        state.currentStation.label="Breast Cancer"
      }
      state.loggerURL=state.init.loggerURL;
      state.maxgroupinuse=state.init.maxgroupinuse;
      var ptlist=state.init.patientMasterList;
      ptlist.forEach(function(e){
        var pid=e.id;
        var pname=e.name;
        var page=e.age;
        var pgender = e.gender;
        var type=e.type;
        e.group.forEach(function(ee){
          var gid=ee.id;
          var index = state.patientlist.findIndex(function(el) {
            return el.id==pid && el.groupid==gid});
          if(index==-1){
            var temp={};
            temp=JSON.parse(JSON.stringify(state.init.patientstemplate));
            temp.id=pid;
            temp.name=pname;
            temp.age=page;
            temp.gender=pgender;
            temp.groupid=gid;
            temp.type=type;
            state.patientlist.push(temp);
          }
        })
      });
      window.dispatchEvent(new Event('reload'));
    },
    resetState(state,obj){
      state.init=JSON.parse(JSON.stringify(obj));
      state.patientlist.splice(0, state.patientlist.length);
      var ptlist=state.init.patientMasterList;
      ptlist.forEach(function(e){
        var pid=e.id;
        var pname=e.name;
        var page=e.age;
        var pgender = e.gender;
        var type=e.type;
        e.group.forEach(function(ee){
          var gid=ee.id;
          var index = state.patientlist.findIndex(function(el) {
            return el.id==pid && el.groupid==gid});
          if(index==-1){
            var temp={};
            temp=JSON.parse(JSON.stringify(state.init.patientstemplate));
            temp.id=pid;
            temp.name=pname;
            temp.age=page;
            temp.gender=pgender;
            temp.groupid=gid;
            temp.type=type;
            state.patientlist.push(temp);
          }
        })
      });
    },
    saveConfig(state, obj){
      var index = state.currentPatientIndex;
      console.log("SAVE=>"+obj.id+"   "+index);
      state.patientlist[index].layout=JSON.parse(JSON.stringify(obj.layout));
      //Need to remove when the PRO registration is done , for front debug purpose
      var objWlist = obj.layout.map(function(ee) {return ee.c});
      state.patientlist[index].wlist.forEach(function(e){
        var i=objWlist.indexOf(e.id);

        if(i!=-1){
            e.count=0;
        }else {
          e.count=-1;
        }

      })
    },
    updateAlert(state,obj){
      var pindex  = state.patientlist.findIndex(function(el) {
              return el.id==obj.pid && el.groupid==obj.group});
      console.log("UPDATE ALERT"+pindex);

      var windex = state.patientlist[pindex].wlist.map(function(e) {return e.id}).indexOf(obj.wid);
      var value = state.patientlist[pindex].wlist[windex].count;
      if(obj.message==""){  //clear message
          if(value>0) {
            state.patientlist[pindex].wlist[windex].count--;
          }
      }else {  //add message
        state.patientlist[pindex].wlist[windex].count++;
      }
    },
    setAlerts(state,obj) {
      var pindex = state.patientlist.findIndex(function(el) {
        return el.id===obj.pid && el.groupid===obj.group;
      });
      console.log("Setting alerts for " + obj.widget + ", " + pindex + " to " + obj.count);
      var windex = state.patientlist[pindex].wlist.map(function(e) {return e.id}).indexOf(obj.wid);
      var value = state.patientlist[pindex].wlist[windex].count;
      state.patientlist[pindex].wlist[windex].count = obj.count;
    },
    selstation(state,obj){
      if(obj.value!=-1){
        state.currentStation.id=state.init.cancertypes[obj.value].id;
        state.currentStation.label=state.init.cancertypes[obj.value].label;
      }
      else {
        state.currentStation.id=-1;
        state.currentStation.label="";
      }
      state.currentGroup.id=0;
    },
    setgroupid(state,obj){
      state.currentGroup.id=obj.value;
    },
    saveWidgetSettings(state, obj){
      if(false){
        console.log("Save Widget Settings =>")
        console.log(obj)
      }
      var index = state.currentPatientIndex;
      var windex = state.patientlist[index].widgetSettings.map(function(e){return e.id}).indexOf(obj.wid);
      // console.log("save widget for=>"+"Pt "+index+"wd "+windex)
      if(windex >= 0) {
        state.patientlist[index].widgetSettings[windex].datasettings=JSON.parse(JSON.stringify(obj.datasettings));
      } else {
        state.patientlist[index].widgetSettings.push({id: obj.wid, datasettings:JSON.parse(JSON.stringify(obj.datasettings))});
      }
    },
    setCurrentPatientIndex(state, obj){
      if(debug){
        console.log("Set Current Patient Index =>")
        console.log(obj)
      }
      state.currentPatientIndex =  state.patientlist.findIndex(function(el) {
              return el.id==obj.pid && el.groupid==obj.group});
    },
    loadPatientData(state, obj) {
      state.patientData = obj;
    },
    resetPatientData(state) {
      state.patientData = [];
    }
  },
  getters: {
    getfilterEnable: state=>{
      return state.filterEnabled
    },
    getmaxgroupinuse: state=>{
      return state.maxgroupinuse
    },
    getLoggerURL: state=> {
      return state.loggerURL
    },
    testResetState: state =>{
      return state.patientlist[7].wlist[1].count
    },
    isDebugging: state => {
      return state.debugEnabled;
    },
    getlayoutbyid:state=>{
      if(state.currentPatientIndex!=-1){
        return state.patientlist[state.currentPatientIndex].layout;
      }else {
        return []
      }
    },
    getNotificationList:state=> {
      return [ {patient:{name:"Bridget Kearns", age:52, gender:"Female"}, timestamp: '2017-10-09',notes:[{"type":-1,"text":"Pain rating scale has decreased from 7 to 3 in last 24 hours"},{"type":0,"text":"Anxiety remains at 13 each of the last 13 days"}]},
      {patient:{name:"Tyler Durden", age:55, gender:"Male"}, timestamp: '2017-10-09T03:00:04Z',notes:[{"type":1,"text":"Pain rating scale has increased from 2 to 8 in last 24 hours"}]}
            ]
    },
    getDataSettings:state=>{
      return function(obj){
        var index = state.patientlist.findIndex(function(el) {
          return el.id==obj.id && el.groupid==obj.group});
          var windex = state.patientlist[index].widgetSettings.map(function(e){return e.id}).indexOf(obj.wid);
        return state.patientlist[index].widgetSettings[windex];
      }
    },
    getpatientbyid:state => {
      var self=this;
      return function(obj){
        var index = state.patientlist.findIndex(function(el) {
          return el.id==obj.id && el.groupid==obj.group});
        return state.patientlist[index];
      }
    },
    getCurrentStation: state =>{
        return state.currentStation;
    },
    getcurrentGroup:state=>{
      return state.currentGroup;
    },
    getPatientList: state=>{
      var l=[];
      l=JSON.parse(JSON.stringify( state.patientlist));
      if(state.currentStation.id!=-1){
        l=l.filter(function(e) {
          return (e.type==state.currentStation.id)
        })
      }
      return l ;
    },
    getPatientMasterList: state=>{
      return state.init.patientMasterList;
    },
    getPatientData: state=>{
      return function(patientId) {
        let index = state.patientData.findIndex(function(patient) {
          return patient.id===patientId
        });
        return state.patientData[index];
      }
    },
    hasLoadedPatientData: state=>{
      return  (state.patientData.length > 0);
    }
  },
  actions: {
    initStore({commit}){
      commit('init')
    },
  }
  // plugins: debug ? [createLogger()] : []
})
