/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import 'react-native-gesture-handler';
import React, {useRef } from 'react';
//import type {PropsWithChildren} from 'react';

import { NavigationContainer, CommonActions, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator} from '@react-navigation/drawer';
import {Calendar} from 'react-native-calendars';
import DeviceInfo from 'react-native-device-info';
import { createStackNavigator} from '@react-navigation/stack';
import BleManager from 'react-native-ble-manager';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import moment, { now } from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import analytics from '@react-native-firebase/analytics';
import auth from '@react-native-firebase/auth';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import notifee, {EventType} from '@notifee/react-native';

import {
  Alert,
  ActivityIndicator,
  AppRegistry,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  Modal,
  TextInput,
  Button,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  NativeModules,
  NativeEventEmitter,
  TouchableWithoutFeedback,
  Image,
  useColorScheme,
  View,
  requireNativeComponent,
  TouchableHighlight,
} from 'react-native';

var currentUserData,userDeviceInfo,configArray;
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const languages = ['English','Spanish','French','German'];
const months = ["Jan.","Feb.","Mar.","Apr.","May.","Jun.","Jul.","Aug.","Sept.","Oct.","Nov.","Dec."];
const avidPurpleHex = '#722053';
const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
const userAccountPtr = firestore().collection("User Accounts");
const contentTypeString = 'application/x-www-form-urlencoded';
const scanTimeout = 8;
var usageArray = [];
var masterPresetArray = [];
var answers = [0,1,2,3,4,5,6,7,8,9,10,'N','Y','NA','S','default'];
var appVersion = '1.1.0';
var usageCount = 0;
var questionCount = 0;

const styles = StyleSheet.create({
  
  loginScreen:{
    justifyContent: 'center',
    alignItems: 'center',
    height:'100%',
    backgroundColor:'white',
    

  },
  headerBarStyle:
  {
    
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  mainScreenModal:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    
  },
  mainScreenModalView:{
    backgroundColor:'white',
    borderRadius:15,
    padding:20,
    borderWidth:1,
    borderColor:'black'
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },

  highlight: {
    fontWeight: '700',
  },

  loginScreenImage:
  {
    width: '60%',
    resizeMode:'contain',
    marginBottom:'10%'
  },

  grayButton:
  {
    fontFamily:'Proxima Nova',
    fontSize:15,
    fontWeight:'bold',
    color:'gray'
  },
  purpleButton:
  {
    fontFamily:'Proxima Nova',
    fontSize:17,
    fontWeight:'bold',
    color:'#722053'
  },
  dayUsageRow:
  {
    backgroundColor:'#e0ecff',
    fontSize:20
   

  },

  

    textFields:{
      borderBottomWidth: 1,
      borderColor: 'lightgray',
      height: 30,
      color: 'gray',
   
      fontFamily:'Verdana-bold',
      marginBottom: '6%'
    },
  
    loginLabels:
    {
      fontSize: 20,
      fontFamily: 'Proxima Nova',
      fontWeight:'400',
      color: 'black'
    },
    usageDetailLabels:
    {
      fontSize:16,
      color: '#555555',
      fontWeight:'bold',
      flex:2,
      alignSelf:'flex-start'
    },
    usageDetailData:
    {
      fontSize:16,
      color: '#969696',
      flex:1,
      fontWeight:'bold',
      alignSelf:'flex-end',
      textAlign:'right'
    },
    usageDataDetailCell:
    {
      padding:'3%',
      flexDirection:'row',
      alignContent:'stretch'
    },
    signUpLabels:
    {
      fontSize: 15,
      fontFamily: "Verdana-Bold",
      color:'gray',
      marginBottom:'3%'
      
    },
  
    forgotLabels:
    {
      color: 'lightgray'
    }

});

function changeNumBase(number)
{
  let hexStr = number.toString(16);
  if(hexStr.length ==1){
      hexStr = '0'+hexStr;
  }
  return hexStr;
}

function generateDateTimeString(year,month,day,hour,minute)
{
  var dateString = months[month-1]+" "+day+" 20"+year;
  var timeString= "";
  if(hour == 0 || hour == 12)
  {
    timeString+="12";
  }
  else if(hour > 12)
  {
    if(hour % 12 < 10)
      timeString += "0"+(hour%12).toString();
    else
      timeString += (hour%12).toString();
  }
  else
  {
    timeString += hour.toString();
  }
  if(minute < 10)
    minute = "0"+minute;
  timeString += ":"+minute+" ";
  if(hour < 12)
    timeString += "AM";
  else
    timeString += "PM";

  return [dateString,timeString];
//return months[month]+" "+day+" 20"+year+" "+(hour%13).toString()
}

function calculation(add_0,add_1)
{
  return parseInt( (changeNumBase(add_1)+ changeNumBase(add_0)) ,16);
} 

function convertDateStringForCompare(year,month,day,hour,minute)
  {
    //2023-05-12 05:35
    var returnString = "";
    returnString += "20"+year+"-";
    if(month < 10)
      returnString += "0"+month+"-";
    else
      returnString += month+"-";
    
    if(day < 10)
      returnString += "0"+day+" ";
    else
      returnString += day+" ";
  
    if(hour<10)
      returnString += "0"+hour+":";
    else
      returnString += hour+":";
  
    if(minute<10)
      returnString += "0"+minute;
    else
      returnString += minute;
  
    return returnString;
  
  }

  function showNotification(titleInput,bodyInput)
  {
    notifee.requestPermission().then(()=>{

      notifee.displayNotification({
        title:titleInput,
        body:bodyInput
  
      });

    });
    
  }


const webURLS = {
  login:"https://avid.vqconnect.io/nodejs/login",
  deviceList:"https://avid.vqconnect.io/nodejs/deviceList",
  userList:"https://avid.vqconnect.io/nodejs/userList"
}

const bluetoothIDs ={
  svc_1110: "F0001110-0451-4000-B000-000000000000",
  svc_1130: "F0001130-0451-4000-B000-000000000000",
  chr_1111: "F0001111-0451-4000-B000-000000000000",
  chr_1131: "F0001131-0451-4000-B000-000000000000",
  chr_1132: "F0001132-0451-4000-B000-000000000000",
}


function compareProperty({ key, direction }) {
  return function (a, b) {
      const ap = a[key] || ''
      const bp = b[key] || ''

      return (direction === "desc" ? -1 : 1) * ((typeof ap === "string" && typeof bp === "string") ? ap.localeCompare(bp) : ap - bp)
  }
}

function getMonthUsageData(month,year)
{
  return new Promise(function(resolve,reject){
    const usageOver20 = {key:'over20',color:'green'};
    const usageUnder20 = {key:'under20',color:'purple'};
    const allQuestionsAnswered = {key:'allAnswered',color:'red'};
    const skippedQuestions = {key:'skippedQuestions',color:'pink'};

    var dataObject = {};
    const monthDays= ["31","28","31","30","31","30","31","31","30","31","30","31"];
    if(year%4 == 0)
      monthDays[1]="29";
    console.log("Hot Dogggs "+month+" "+year);
    month < 10 ? month = "0"+month:month=month;
    console.log("Your Info Is "+currentUserData.uid+" "+currentUserData);
    console.log("Address You "+webURLS.userList+"?action=findUserUsageDataByMonth&startTime="+year+"-"+month+"-01&endTime="+year+"-"+month+"-"+monthDays[month-1]+"&eMail="+currentUserData.email+"&uid="+currentUserData.uid+"&token="+currentUserData.token);
    fetch(webURLS.userList+"?action=findUserUsageDataByMonth&startTime="+year+"-"+month+"-01&endTime="+year+"-"+month+"-"+monthDays[month-1]+"&eMail="+currentUserData.email+"&uid="+currentUserData.uid+"&token="+currentUserData.token,{method:'GET'}).then((responseData)=>responseData.json()).then((responseJson)=>{
      console.log("Cal Data Is "+JSON.stringify(responseJson.data));
      console.log("The size is "+responseJson.data.length);
      const newValue = responseJson.data.sort(compareProperty({key:"_id",direction:"desc"}));
      //newValue.toSorted();
      console.log("New Things Are "+newValue);
      if(responseJson.data.length == 0)
      {
        console.log("No DAta");
        resolve({});
        return;
        //resolve("none");
        //navigation.navigate(nextLoginScreen,{calendarInfo:"none"});
      }

      for(var i=0;i<responseJson.data.length;i++)
      { 
        if(responseJson.data[i].MinOfUseTotal > 0)
        {
          var currentDot = responseJson.data[i].MinOfUseTotal >= 20 ? usageOver20:usageUnder20;
          dataObject[responseJson.data[i]._id]={dots:[currentDot]};

          fetch(webURLS.userList+"?action=findUserUsageDataByDay&dayTime="+responseJson.data[i]._id+"&uid="+currentUserData.uid+"&token="+currentUserData.token).then((responseaa)=>responseaa.json()).then((responseJsonaa)=>{
            var skipped = false;
            for(var j=0;j<responseJsonaa.data.length;j++)
            {
              if(Object.values(responseJsonaa.data[j]).includes("UA"))
              {
                skipped=true;
                break;
              }
          
            }
            if(skipped==true)
            {
              dataObject[responseJsonaa.data[0].StandardTimeOfTreatment.substring(0,10)].dots.push(skippedQuestions);
            }
            else
            {
              dataObject[responseJsonaa.data[0].StandardTimeOfTreatment.substring(0,10)].dots.push(allQuestionsAnswered);
            }
            resolve(dataObject);
          }).catch((error)=>{
            console.log(error.name+" "+error);
            Alert.alert("Notice","Network Error - 1");
            if(error.name == "SyntaxError")
            {
              Alert.alert("Notice","Network Error - 1A");
              reject("Network ErrorA");
            }
        
        
          });
        }
      }
    }).catch((error)=>{
      Alert.alert("An Error Man "+error);
      Alert.alert("Notice","Network Error - 2");
      if(error.name == "SyntaxError")
      {
        Alert.alert("Notice","Network Error");
        Alert.alert("Notice","Network Error - 2A");
        reject("Network ErrorB");
      }
  
  
    }); //End Fetch
  })
}


function App(){
  console.log("Step 0");
 
  //Start Bluetooth Manager
  React.useEffect(()=>{BleManager.start();});
  //if(auth().currentUser)
  //  auth().signOut();
  console.log("Active User "+auth().currentUser);
  analytics().logAppOpen();
  const MainStack = ({route}) =>
  //function MainStack(route)
  {
      console.log("The Parameters Are "+JSON.stringify(route.params));
      var calendarData = route.params?route.params.calendarInfo:null;

      
      var serialNumberInput = route.params?route.params.serialNumber:null;
      var fromInput = route.params?route.params.from:null;
      console.log("Cal Data Is "+JSON.stringify(calendarData));
      console.log("Ussss Data "+currentUserData);
      return(<Drawer.Navigator initialRouteName='HOME' screenOptions={{drawerActiveTintColor:'white',drawerInactiveTintColor:'white',  drawerStyle:{drawerActiveTintColor:'yellow',  backgroundColor: avidPurpleHex}}}>
      <Drawer.Screen name="HOME" component={MainScreen} initialParams={{calendarInfo:calendarData,serialNumber:serialNumberInput,from:fromInput}}/>
      <Drawer.Screen name="USAGE SUBSTACK" component={UsageHistoryStack} options={{drawerItemStyle:{display:"none"},unmountOnBlur:true,headerShown:false}}/>
      <Drawer.Screen name ="LOGOUT" component={LogoutStack}/>
    </Drawer.Navigator>);
      getMonthUsageData(new Date().getMonth()+1,new Date().getFullYear()).then((result)=>{
       
      });


    
  }
  const LogoutStack = ({navigation}) =>
  //function LogoutStack(navigation)
  {
    if(auth().currentUser)
        auth().signOut();

    currentUserData = null;
    AsyncStorage.removeItem("currentUserData");
    AsyncStorage.removeItem("isConnected");
    AsyncStorage.removeItem("lastDeviceAddress");

    BleManager.getConnectedPeripherals([]).then((peripheralArray)=>{
      if(peripheralArray.length != 0)
        BleManager.disconnect(peripheralArray[0].id).then(()=>{
          
          });
    });
     
    
    //Reset Navigation Stack
    console.log("Steep 1");
    navigation.dispatch(    
      CommonActions.reset({
        index:0,
        routes:[{name:"Login"}]
      })
    );
    console.log("Steep 2");
    if(currentUserData)
    {
    const logoutRequestOptions = {
      method:'POST',
      headers: new Headers({'Content-Type': contentTypeString}),
      body: 'action=signOut&uid='+currentUserData.uid+"&appversion="+appVersion
      //data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
    };
    console.log("Steep 3");
    fetch(webURLS.login,logoutRequestOptions).then((response)=>response.json()).then((responseJson)=>{
      console.log("Steep 4");
      //Unset Current Usage Data
      
      console.log("Steep 5");
      
      
    });}
  }

  

  const UsageHistoryStack=({route,navigation})=>{

    
    function convertDateString(input)
    {
      console.log("The Stuff BB "+input.substring(6,7));
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      console.log("The Month Is "+input.substring(6,7)-1);
      return months[parseInt(input.substring(5,7))-1]+" "+input.substring(8,10)+", "+input.substring(0,4);
    }
    
    return(<Stack.Navigator initialRouteName='Day Use Screen' >
    <Stack.Screen name="Day Use Screen" options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',title: convertDateString(route.params.currentDate), headerShown:true, headerLeft: ()=>(<TouchableOpacity onPress={()=>{navigation.navigate("HOME");}}><Text style={{fontWeight:'bold',fontSize:17,color:'white'}}>&nbsp;&lt; Back</Text></TouchableOpacity>    ),}}  initialParams={{currentDate:route.params.currentDate,from:route.params.from}} component={DayUsageScreen}/>
    <Stack.Screen name="Usage Data Detail" component={UsageDetailScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',drawerItemStyle:{display:'none'}}}/>
    </Stack.Navigator>);
  
   } //End UsageHistoryStack


   console.log("Step 1 "+JSON.stringify(auth().currentUser));
   var nextScreen = auth().currentUser?"Main":"Login";
   console.log("Step 2 "+nextScreen);
  

   if(auth().currentUser)
    {
      AsyncStorage.getItem("currentUserData").then((userData)=>{
        if(!userData)
        { 
          console.log("There is no user data. Boo!!");
          nextScreen = "Login";
          return;
        }
          
        currentUserData = JSON.parse(userData);
        console.log("Data Successful! "+JSON.stringify(currentUserData));
       
        //return;
        
        console.log("cheddar cheese");
      }).then(()=>{
        
        //userDeviceInfo = await AsyncStorage.getItem("userDeviceInfo");
        
        AsyncStorage.getItem("userDeviceInfo").then((deviceInfo)=>{

          userDeviceInfo = deviceInfo;
          console.log("user successful!");
          //return;

        }).then(()=>{console.log("Hamburgers Are Great!");return (
          <NavigationContainer>
     <Stack.Navigator initialRouteName={nextScreen}>
       <Stack.Screen name="Login" component={LoginScreen} options={{unmountOnBlur:true,headerShown:false}}/>
       <Stack.Screen name="Forgot Username" component={ForgotUsernameScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
       <Stack.Screen name="Forgot Password" component={ForgotPasswordScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
       <Stack.Screen name="Sign Up" component={SignupScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
       <Stack.Screen name="Main" component={MainStack} options={{headerShown:false}}/>
       <Stack.Screen name="Select Device" component={DeviceSelection} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white'}}/>
     </Stack.Navigator>
     </NavigationContainer>
        );});
      }).then((returnValue)=>{


      console.log("Taa Daaaa "+returnValue);
      return returnValue;
    });
      console.log("Doo Daa Dee");
      return (
        <NavigationContainer>
   <Stack.Navigator initialRouteName={nextScreen}>
     <Stack.Screen name="Login" component={LoginScreen} options={{unmountOnBlur:true,headerShown:false}}/>
     <Stack.Screen name="Forgot Username" component={ForgotUsernameScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
     <Stack.Screen name="Forgot Password" component={ForgotPasswordScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
     <Stack.Screen name="Sign Up" component={SignupScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
     <Stack.Screen name="Main" component={MainStack} options={{headerShown:false}}/>
     <Stack.Screen name="Select Device" component={DeviceSelection} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white'}}/>
   </Stack.Navigator>
   </NavigationContainer>
      );

    

    }
    else
    {
      return (
        <NavigationContainer>
        <Stack.Navigator initialRouteName={nextScreen}>
          <Stack.Screen name="Login" component={LoginScreen} options={{unmountOnBlur:true,headerShown:false}}/>
          <Stack.Screen name="Forgot Username" component={ForgotUsernameScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
          <Stack.Screen name="Forgot Password" component={ForgotPasswordScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
          <Stack.Screen name="Sign Up" component={SignupScreen} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',backgroundColor:'white'}}/>
          <Stack.Screen name="Main" component={MainStack} options={{headerShown:false}}/>
          <Stack.Screen name="Select Device" component={DeviceSelection} options={{headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white'}}/>
        </Stack.Navigator>
        </NavigationContainer>
      );
    }
    
 
}

const DayUsageScreen = ({route,navigation}) =>
{
    const [tableData,setTableData] = React.useState([[]]);
    const [dataLoaded,setDataLoaded] =React.useState(false);
    const [date,setDate] = React.useState("");
    const [questionHeight,setQuestionHeight] = React.useState(40);
    const [usageHeight,setUsageHeight] = React.useState(40);

    const [usageBtnTxtClr,setUsageBtnTxtClr] = React.useState('#555555');
    const [usageBtnBkgrndClr,setUsageBtnBkgrndClr] = React.useState('white');
    const [questionBtnBkgrndClr,setQuestionBtnBkgrndClr] = React.useState('white');
    const [questionBtnTxtClr,setQuestionBtnTxtClr] = React.useState('#555555');
    const [allBtnBkgrndClr,setAllBtnBkgrndClr] = React.useState(avidPurpleHex);
    const [allBtnTxtClr,setAllBtnTxtClr] = React.useState('white');

    var usageData=null;
    var tableInfo=[];

    fetch(webURLS.userList+"?action=findUserUsageDataByDay&dayTime="+route.params.currentDate+"&uid="+currentUserData.uid+"&token="+currentUserData.token).then((response)=>response.json()).then((responseJson)=>{
      usageData = responseJson.data;
      //console.log("Information "+JSON.stringify(usageData));
      for(var x = 0;x < responseJson.data.length;x++)
      {
        console.log("User Data Is "+responseJson.data[x].uid+" "+currentUserData.uid);
        var currentObj = [];
        currentObj.push(" "+responseJson.data[x].DateOfTreatment.substring(0,13));
        var ampm = ""
        var currentTime = ""

        if(parseInt(responseJson.data[x].StandardTimeOfTreatment.substring(11,13)) > 12)
        {
          currentTime += parseInt(responseJson.data[x].StandardTimeOfTreatment.substring(11,13)) - 12;
          ampm = "PM";
        }
        else
        {
          currentTime += parseInt(responseJson.data[x].StandardTimeOfTreatment.substring(11,13));
          ampm = "AM";
        }
        currentTime += ":";
        currentTime += responseJson.data[x].StandardTimeOfTreatment.substring(14,16) +" "+ampm;
        //console.log("Hours Are "+responseJson.data[x].StandardTimeOfTreatment.substring(11,13))
        //currentObj.push(responseJson.data[x].StandardTimeOfTreatment.substring(10,16));
        currentObj.push(currentTime);
        if(responseJson.data[x].Type == "U")
        {
          currentObj.push(responseJson.data[x].PresetNumber);
          //currentObj.push(responseJson.data[x].MinOfUse);
        }
        else
        {
          currentObj.push("");
          //currentObj.push("");
        }
        currentObj.push(">");
        //var currentElement = <Row data={["A","B"]} style={{backgroundColor:currentColor}}></Row>
        console.log("This thing is "+currentObj);
        console.log("Horses "+currentObj+" "+tableInfo.includes([currentObj[0],currentObj[1],currentObj[2],currentObj[3]]));

        if(tableInfo.length == 0)
          tableInfo.push(currentObj)
        else
        {
          var itemExists = false;
          for(var i=0;i<tableInfo.length;i++)
          {
            if(JSON.stringify(tableInfo[i])==JSON.stringify(currentObj))
            {
              itemExists = true;
              break;
            }
            //console.log(JSON.stringify(tableInfo[i])==JSON.stringify(currentObj));
          }
          if(!itemExists)
            tableInfo.push(currentObj);
        }
        /*
        if(!tableInfo.includes(currentObj))
          tableInfo.push(currentObj);
        console.log("Sponge"+currentObj==tableInfo[0]);*/
      }
      if(dataLoaded == false)
      {
        setDataLoaded(true);
        setTableData(tableInfo);
      }

    });

    function setButtons(sender)
    {
      if(sender == "Usage")
      {
        setAllBtnBkgrndClr("white");
        setAllBtnTxtClr("#555555");
        setQuestionBtnBkgrndClr("white");
        setQuestionBtnTxtClr("#555555");
        setUsageBtnBkgrndClr(avidPurpleHex);
        setUsageBtnTxtClr("white");
      }
      if(sender == "Question")
      {
        setAllBtnBkgrndClr("white");
        setAllBtnTxtClr("#555555");
        setQuestionBtnBkgrndClr(avidPurpleHex);
        setQuestionBtnTxtClr("white");
        setUsageBtnBkgrndClr("white");
        setUsageBtnTxtClr("#555555");
        
      }
      if(sender == "All")
      {
        setAllBtnBkgrndClr(avidPurpleHex);
        setAllBtnTxtClr("white");
        setQuestionBtnBkgrndClr("white");
        setQuestionBtnTxtClr("#555555");
        setUsageBtnBkgrndClr("white");
        setUsageBtnTxtClr("#555555");
      }
    }
  

    const widthArray = [Dimensions.get('screen').width * 0.4,Dimensions.get('screen').width * 0.3,Dimensions.get('screen').width * 0.2,Dimensions.get('screen').width * 0.1];

    return(<View>
      <View style={{alignSelf:'center',  flexDirection:'row',padding:'5%'}}>
      <TouchableOpacity onPress={()=>{setButtons("Usage");setQuestionHeight(40);setUsageHeight(0);}} style={{flex:1,borderWidth:1,borderColor:avidPurpleHex,backgroundColor:usageBtnBkgrndClr}}><Text style={{padding:'4%',alignSelf:'center', fontSize:16,fontWeight:'bold',color:usageBtnTxtClr}}>Usage</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>{setButtons("Question");setQuestionHeight(0);setUsageHeight(40);}} style={{flex:1,borderWidth:1,borderColor:avidPurpleHex,backgroundColor:questionBtnBkgrndClr}}><Text style={{padding:'4%',alignSelf:'center',fontSize:16,fontWeight:'bold',color:questionBtnTxtClr}}>Question</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>{setButtons("All");setQuestionHeight(40);setUsageHeight(40);}} style={{flex:1,borderWidth:1,borderColor:avidPurpleHex,backgroundColor:allBtnBkgrndClr}}><Text style={{padding:'4%',alignSelf:'center',fontSize:16,fontWeight:'bold',color:allBtnTxtClr}}>All</Text></TouchableOpacity>
     
      </View>
      <Table>
        <Row textStyle={{fontSize:16,fontWeight:'bold',color:'#555555',textAlign:'center'}} widthArr={widthArray} data={["Date","Time","Preset#",""]}></Row>
        <ScrollView>
      {
        tableData.map((rowData,index) => (
  
          <TouchableOpacity buttonKey={index} onPress={()=>{var boolVal;if(rowData[2]==""){boolVal=false;}else{boolVal=true;}navigation.navigate("Usage Data Detail",{dataObject:usageData[index],isUsage:boolVal});}}>
          <Row widthArr={widthArray} textStyle={{fontSize:16,fontWeight:'bold',color:'#555555',textAlign:'center'}} key={index} data={rowData} style={[styles.dayUsageRow,{height:questionHeight,backgroundColor:'#e0ecff'},rowData[2] == "" && {height:usageHeight,backgroundColor:'#d9fae9'}]} />
          </TouchableOpacity>
  
        ))
      }</ScrollView>
  
  
        
      </Table>
     
    </View>);
} // End DayUsageScreen

const SignupScreen = ({navigation}) =>
{
  const [formValid,setFormValid] = React.useState(false);
  //const [emailStatus,setemailstatus] = [usernameStatus,setUsernameStatus] = [confirmPassword,setConfirmPassword] = [accountNumber,setAccountNumber] = [username,setUsername] = [eMail,setEmail] = [nameEntry,setNameEntry] = [password,setPassword],[doctorEmail,setDoctorEmail],[email1,setemail1],[email2,setemail2],[email3,setemail3] = React.useState("");
  const [username,setUsername] = React.useState("");
  const [eMail,setEmail] = React.useState("");
  const [nameEntry,setNameEntry] = React.useState("");
  const [patientName,setPatientName] = React.useState("");
  const [password,setPassword] = React.useState("");
  const [doctorEmail,setDoctorEmail] = React.useState("");
  const [email1,setemail1] = React.useState("");
  const [email2,setemail2] = React.useState("");
  const [email3,setemail3] = React.useState("");
  const [accountNumber,setAccountNumber] = React.useState("");
  const [confirmPassword,setConfirmPassword] = React.useState("");
  const [userLabelColor,setUserLabelColor] = React.useState('grey');
  const [emaillabelColor,setEmailLabelColor] = React.useState('grey');
  const [nameLabelColor,setNameLabelColor] = React.useState('grey');
  const [passwordLabelColor,setPasswordLabelColor] = React.useState('grey');
  const [confirmPasswordLabelColor,setConfirmPasswordLabelColor] = React.useState('grey');
  const [usernameStatus,setUsernameStatus]=React.useState("");
  const [emailStatus,setemailstatus] = React.useState("");
  const [confirmPasswordStatus,setConfirmPasswordStatus] = React.useState("");

  const usernameRef = useRef();
  const eMailRef = useRef();
  const doctorRef = useRef();
  const email1Ref = useRef();
  const email2Ref = useRef();
  const email3Ref = useRef();
  const nameRef = useRef();
  const acctRef = useRef();
  const passwordRef = useRef();
  const confirmRef = useRef();

  function buildUserObject()
  {
    var object = {};
    object.name = nameEntry;
    object.email = eMail;
    object.username = username;
    object.password = password;
    object.doctorEmail = doctorEmail;
    object.additionalEmail2 = email2;
    object.additionalEmail3 = email3;
    object.additionalEmail = email1;
    object.accountNumber = accountNumber;
    return object;
  }

  function validateForm()
  {
    return new Promise(function(resolve,reject){
    var status = true;
    var color="";
    const fields = [username,eMail,nameEntry,password];
    const labels = [setUserLabelColor,setEmailLabelColor,setNameLabelColor,setPasswordLabelColor];
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

    //Checking for Blank Fields
    for(var i = 0;i<fields.length;i++)
    {
      
      if(fields[i]=="")
      {
        status=false;
        console.log(fields[i]);
        color="red";
      }
      else
        color="grey";
      
      console.log(fields[i] == "");
      //fields[i] == "" ? ()=>{console.log("birds");setFormValid(false);color="red";}:color="grey";
      console.log(color);
      labels[i](color);
      console.log("Form Valid "+formValid);
    }
    if(password != "" || confirmPassword != "")
    {
      if(password != confirmPassword)
      {
        setPasswordLabelColor("red");
        setConfirmPasswordLabelColor("red");
        setConfirmPasswordStatus("Passwords Don't Match");
        status = false;
      }
      else
      {
        setPasswordLabelColor("grey");
        setConfirmPasswordLabelColor("grey");
        setConfirmPasswordStatus("");
      }}
    if(eMail.indexOf('@') <= -1 || eMail.indexOf(' ') > -1 || eMail.indexOf('.') <=1)
    {
          setemailstatus("E-mail format is not correct");
          setEmailLabelColor("red");
          status=false;
    }
    else
    {
          setemailstatus("");
          setEmailLabelColor("grey");
    }
    
   
    if(status == false)
      Alert.alert("Signup Error","There are errors on your form. Please correct them before continuing");
    resolve(status);
  });
    
  
  }


  function checkInput(type,value)
  {
    setFormValid(true);
    if(value == "")
    {
      type == "user" ? setUsernameStatus(""):setemailstatus("");
      return;
    }
    const statusMsg = type == "user"?"Username already taken":"E-mail already in use";
    
    console.log("Validate");
    setTimeout(()=>{

      //var requestOptions;
      var insertString = type == "user" ? "checkUsername&username="+value:"checkEmail&email="+value;
      
        
        
       var requestOptions = {method:'POST',headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded', /* <-- Specifying the Content-Type*/}),body: 'action='+insertString+'&appversion='+appVersion};
          //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
      fetch(webURLS.login,requestOptions).then((res)=>res.json()).then((resjson)=>{

        
      if(resjson.code == "202")
        setFormValid(false);
       
        
      
      if(type=="user")
      {
        if(resjson.code == "202")
        {
          setUsernameStatus(statusMsg);
          setUserLabelColor("red");
        }
        else
        {
          setUsernameStatus("");
          setUserLabelColor("grey");
        }
      }
      else
      {
        if(resjson.code == "202")
        {
          setemailstatus(statusMsg);
          setEmailLabelColor("red");
        }
        else
        {
          setemailstatus("");
          setEmailLabelColor("grey");
        }
      }
      
      
      });
     


    },100);
    
  }

  return(
    <View style={{height:'100%',backgroundColor:'white'}}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAwareScrollView contentContainerstyle={{width:'65%',marginTop:'5%',backgroundColor:'white',alignItems:'center'}}>
    
     
    {/*<ScrollView style={{marginTop:'5%',width:'85%'}} >*/}
    <View style={{flex:5,alignSelf:'center',height:'50%',width:'85%',marginTop:'5%'}}>
    <View style={{flexDirection:'row',marginBottom:'2%'}}>
    <Text style={[styles.signUpLabels,{color:userLabelColor}]}>Username*</Text>
    <Text style={{color:'red',fontSize:10,marginBottom:'2%'}}>{usernameStatus}</Text>
    </View>
    <TextInput onSubmitEditing={()=>eMailRef.current.focus()} ref={usernameRef} style={styles.textFields} onChangeText={(text)=>{setUsername(text);checkInput("user",text);}} value={username}></TextInput>
    
    <View style={{flexDirection:'row',marginBottom:'2%',marginTop:'3%'}}>
    <Text style={[styles.signUpLabels,{color:emaillabelColor}]}>E-Mail*</Text>
    <Text style={{color:'red',fontSize:10,marginBottom:'2%'}}>{emailStatus}</Text>
    </View>
    <TextInput onSubmitEditing={()=>doctorRef.current.focus()} ref={eMailRef} style={styles.textFields} onChangeText={(text)=>{setEmail(text);checkInput("email",text);}} value={eMail}></TextInput>
    
    
    <Text style={[styles.signUpLabels,{marginBottom:'3%',marginTop:'3%'}]}>Doctor E-mail</Text>
    <TextInput onSubmitEditing={()=>email1Ref.current.focus()} ref={doctorRef} style={styles.textFields} onChangeText={(text)=>{setDoctorEmail(text);}} value={doctorEmail}  ></TextInput>
    
   
    <Text style={[styles.signUpLabels,{marginBottom:'3%',marginTop:'3%'}]}>Additional E-Mail 1</Text>
    <TextInput onSubmitEditing={()=>email2Ref.current.focus()} ref={email1Ref} style={styles.textFields} onChangeText={(text)=>{setemail1(text);}} value={email1}></TextInput>
    
    <Text style={[styles.signUpLabels,{marginBottom:'3%',marginTop:'3%'}]}>Additional E-mail 2</Text>
    <TextInput onSubmitEditing={()=>email3Ref.current.focus()} ref={email2Ref} style={styles.textFields} onChangeText={(text)=>{setemail2(text);}} value={email2}></TextInput>
   
    <Text style={[styles.signUpLabels,{marginBottom:'3%',marginTop:'3%'}]}>Additional E-mail 3</Text>
    <TextInput onSubmitEditing={()=>nameRef.current.focus()} ref={email3Ref} style={styles.textFields} onChangeText={(text)=>{setemail3(text);}} value={email3}></TextInput>
    
    
    <Text style={[styles.signUpLabels,{color:nameLabelColor,marginBottom:'3%',marginTop:'5%'}]}>Name*</Text>
    <TextInput onSubmitEditing={()=>acctRef.current.focus()} ref={nameRef} style={[styles.textFields,{marginTop:'5%'}]} onChangeText={(text)=>{setNameEntry(text);}} value={nameEntry}></TextInput>
    
    <Text style={[styles.signUpLabels]}>Account Number</Text>
    <TextInput onSubmitEditing={()=>passwordRef.current.focus()} ref={acctRef} style={styles.textFields} onChangeText={(text)=>{setAccountNumber(text);}} value={accountNumber}></TextInput>
    
    <Text style={[styles.signUpLabels,{color:passwordLabelColor}]}>Password*</Text>
    <TextInput onSubmitEditing={()=>confirmRef.current.focus()} ref={passwordRef} style={styles.textFields} onChangeText={(text)=>{setPassword(text);}} value={password}></TextInput>
    
   
    <View style={{flexDirection:'row',marginBottom:'3%'}}>
    <Text style={[styles.signUpLabels,{color:confirmPasswordLabelColor}]}>Confirm Password*</Text>
    <Text style={{color:'red',fontSize:10}}>{confirmPasswordStatus}</Text>
    </View>
    <TextInput ref={confirmRef} style={[styles.textFields,{marginBottom:'1%'}]} onChangeText={(text)=>{setConfirmPassword(text);}} value={confirmPassword}></TextInput>
    
    
   
    </View>
    
    
    

    </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
    
    <TouchableOpacity onPress={()=>{validateForm().then(result=>{if(result==true){navigation.navigate("Select Device",{newUserInfo:buildUserObject()})}else{console.log("FormNotValid");}});}} style={{ alignSelf:'center', marginTop:50,marginBottom:50, backgroundColor: '#722053', width:"80%" }}><Text style={{ fontFamily: "Verdana-Bold",color: '#fff', textAlign: 'center', fontSize: 25, margin:10, }}>Signup</Text></TouchableOpacity>
   
    </View>
    
  );
}

const MainScreen = ({route,navigation}) =>
//function MainScreen({route,navigation})
{
  AsyncStorage.removeItem("isConnected");
  //AsyncStorage.removeItem("lastDeviceAddress");
  
  console.log("Route is "+route);
  console.log("Params Is "+route.params);
  //var keys = Object.keys(localCurrentUserData);
  //console.log("Device Is "+currentUserData.uid);
  const [currentDeviceString,setCurrentDeviceString] = React.useState('');
  const [currentUserInfo,setCurrentUserInfo] = React.useState();
  const [markedDates,updateMarkedDates] = React.useState(route.params.calendarInfo);
  const [isUpdating,setIsUpdating] = React.useState(false);
  const [verifyShown,setVerifyShown] = React.useState(false);
  const [backgroundInitiated,setBackgroundInitiated] = React.useState(false);
  const [isBackground,setIsBackground] = React.useState(true);
  const [scanButtonColor,setScanButtonColor] = React.useState('');
  const [lastUploadAddress,setLastUploadAddress] = React.useState(896);
  const [complianceTimeString,setComplianceTimeString] = React.useState("");
  const [scanButtonOpacity,setScanButtonOpacity] = React.useState(1.0);
  const [isScanning,setIsScanning] = React.useState(false);
  const [scanStatus,setScanStatus] = React.useState("");
  const [scanAddress,setScanAddress] = React.useState("");
  const [scanCycleActive,setScanCycleActive] = React.useState(false);
  const [lastUploadTime,setLastUploadTime] = React.useState('');

  const Circle = (color,size) => {return <View style={{alignSelf:'center',width:size,height:size,borderRadius:size/2,backgroundColor:color}}></View>};
  console.log("Marked Dates Is "+markedDates);
  /*AsyncStorage.getItem("lastUploadAddress").then((value)=>{
    setLastUploadAddress(parseInt(value));
    console.log("The last address was "+value);
  });*/

  /******** */

  
    /*
  function updateDeviceTime(peripheral)
  {
             console.log("Eggplants");
             var nowTime= new Date();
             console.log("Eggplants1");  
             let dateMessage = [128,Number(nowTime.getYear()-100),Number((nowTime.getMonth())+1),Number(nowTime.getDate()),Number(nowTime.getHours()),Number(nowTime.getMinutes()),Number(nowTime.getSeconds())];
 
             BleManager.connect(peripheral.id).then(()=>{
 
               BleManager.retrieveServices(peripheral.id,[bluetoothIDs.svc_1110]).then((peripheralInfo)=>{
 
                 BleManager.write(peripheral.id,bluetoothIDs.svc_1110,bluetoothIDs.chr_1111,dateMessage).then(()=>{
                   console.log("Write New Time Success");
                   setLastUploadTime(""+(currentDate.getYear()+1900)+"-"+(currentDate.getMonth()+1+"-"+(currentDate.getDate())));
                   console.log("Big Mac With Cheese");
                   AsyncStorage.removeItem("isConnected");
                   BleManager.disconnect(peripheral.id);
                   console.log("Successfully Wrote Time ");
                   showNotification("Successfully Wrote Time ");
                   isConnected = false;
 
                 }).catch((error)=>{BleManager.disconnect(peripheral.id);showNotification("Error 1 ",error)});
 
               }).catch((error)=>{BleManager.disconnect(peripheral.id);showNotification("Error 2",error)});
 
 
             }).catch((error)=>{BleManager.disconnect(peripheral.id);showNotification("Error 3",error)});
  }*/

  async function getDeviceData(peripheral,service,writeCharacteristic,readCharacteristic,address)
  {
    //setScanStatus("Reading Device Data");
    setScanButtonOpacity(0.3); 
    setScanCycleActive(true);
    return new Promise((resolve,reject)=>{

      BleManager.connect(peripheral.id).then(()=>{
        BleManager.retrieveServices(peripheral.id,[service]).then((peripheralInfo)=>{
          BleManager.write(peripheral.id,service,writeCharacteristic,address).then(()=>{
            
            if(readCharacteristic != bluetoothIDs.chr_1132)
            {
              setScanStatus("Updating Upload Date");
              var currentDate = new Date();
              console.log(currentDate.toTimeString().substring(0,8));
              setLastUploadTime(""+(currentDate.getYear()+1900)+"-"+(currentDate.getMonth()+1+"-"+(currentDate.getDate())+" "+currentDate.toTimeString().substring(0,8)));
              /*
              AsyncStorage.getItem("userDeviceInfo").then((deviceJSON)=>JSON.parse(deviceJSON)).then((deviceInfo)=>{

    
          setLastUploadTime(deviceInfo.lastdatatime);
              */
             //var currentDeviceInfo = await JSON.parse(AsyncStorage.getItem("userDeviceInfo"));
              //setLastUploadTime(currentDate);
              console.log("Big Mac With Cheese "+lastUploadTime+" "+""+(currentDate.getYear()+1900)+"-"+(currentDate.getMonth()+1+"-"+(currentDate.getDate())));
              setScanStatus("");
              setIsUpdating(false);
              setScanCycleActive(false);
              BleManager.disconnect(peripheral.id);
              Alert.alert("Notice","Upload Data Successful. Your AVID device has been disconnected and is ready for use.",[{text:"OK",onPress:()=>{var theDate = new Date();
                console.log("Hello Dolly, Nice to See You");
                //console.log(theDate.getMonth()+" "+(theDate.getYear()+1900));
                updateCalendar([theDate.getMonth()+1,theDate.getYear()+1900]);}}]);
              return(["Success",0,0]);
              //Write Time
              console.log("The id for this is "+peripheral.id);
              //BleManager.disconnect(peripheral.id);
              console.log("Eggplants");
              
              console.log("Eggplants1");  
              let dateMessage = [128,Number(nowTime.getYear()-100),Number((nowTime.getMonth())+1),Number(nowTime.getDate()),Number(nowTime.getHours()),Number(nowTime.getMinutes()),Number(nowTime.getSeconds())];
              console.log("The Time Msg "+dateMessage);
         
        
        
              
            
            }
            else
            {
            setTimeout(()=>{
              BleManager.read(peripheral.id,service,readCharacteristic).then((readData)=>{
                console.log("Data Is "+address+" "+readData);
                if(address[0] == 0 && address[1]==0)
                {
                  setScanStatus("Reading Device Info");
                  setScanAddress("");
                  let complianceTime = parseInt(changeNumBase(readData[3])+changeNumBase(readData[2])+changeNumBase(readData[1])+changeNumBase(readData[0]),16);
                  var complianceHours = complianceTime/60 < 1?0:1;
                  let comTime = `${complianceHours} hrs ${complianceTime%60} min`;
                  configArray = [comTime,languages[readData[12]],readData[14],Boolean(readData[15]),Boolean(readData[16])];
                  let lastAddressVal = (256*readData[5]+readData[4])-16;
                  console.log("Russ "+lastAddressVal+" "+lastUploadAddress);

                  try{
                  AsyncStorage.setItem("lastDeviceAddress",lastAddressVal.toString()).then(()=>{
                    
                  }).catch((error)=>{console.log("Set Error "+error)});
                  AsyncStorage.getItem("lastDeviceAddress").then((response)=>{console.log("The Response A "+response)}).catch((error)=>{console.log("Problem CC "+error)})
                }
                catch(errore)
                {
                  console.log("What was the problem "+errore);
                }
                  if(lastAddressVal > 4070 || (lastUploadAddress != null && lastUploadAddress == lastAddressVal.toString()))
                  {
                    setScanCycleActive(false);  
                    console.log("It was rejected");
                      const noticeString = lastAddressVal > 4070 ? "No New Records. Device was recently reset.":"No New Records";
                      console.log("Here Chicken");
                      
                      console.log(noticeString);
                      //return reject(noticeString);
                      return resolve(["Fail","No New Records",0]);
                     
                  }
                  return resolve([0,readData[5],readData[4]]);
                
                }
                else if(256*address[0]+address[1] <= lastUploadAddress && 256*address[0]+address[1] >= 256)
                {
                                 //console.log("Preset Is "+readData)
                    setScanStatus("Reading Presets");
                    setScanAddress((256*address[0]+address[1]).toString());
                    console.log("Next Preset Address "+[address[0],address[1]+16]);
                    if((256*address[0]+address[1])%32 == 0 && 256*address[0]+address[1] != 896)
                    {
                      console.log("Preset Is This: "+readData);
                      var presetArray = [];
                      if(readData[1]>=128)
                        presetArray.push("Yes");
                      else
                        presetArray.push("No");
 
                      presetArray.push("On");
                      presetArray.push("N");
                      if(readData[9]%2==0)
                        presetArray.push("2");
                      else
                        presetArray.push("4");
 
                      if(readData[9] >= 192)
                        presetArray.push("6/6");
                      else if(readData[9] >= 128)
                        presetArray.push("6|6");
                      else if(readData[9] >= 64)
                        presetArray.push("1|1")
                      else
                        presetArray.push("Continuous");
 
                      presetArray.push(readData[18]);
                      presetArray.push(readData[10]);
                      presetArray.push(readData[12]);
                      presetArray.push(readData[13]);
 
                      console.log("Preset Is "+readData+" "+presetArray);
                      masterPresetArray.unshift(presetArray);
                      console.log("Master Array "+masterPresetArray);
 
                    }
                                 return resolve([1,999,999]); 
                }
                else if(256*address[0]+address[1]>lastUploadAddress)
                {
                    console.log("Read Data Is "+readData);
                    console.log("Position Is "+(256*address[0]+address[1])+" "+lastUploadAddress);
                    console.log("LAst Time "+userDeviceInfo.lastdatatime);
                    setScanStatus("Reading Usage Data ");
                    setScanAddress((256*address[0]+address[1]).toString());
                    var newRecords = false;
                    //if(userDeviceInfo == "null" || !userDeviceInfo.hasOwnProperty('lastdatatime') || ((lastUsageAddress != null && (256*address[0]+address[1]).toString() >= lastUsageAddress) && userDeviceInfo.lastdatatime < convertDateStringForCompare(readData[1],readData[2],readData[3],readData[4],readData[5])))
                    //{
                      if(readData[0] == 93)
                      {
                        usageCount++;
                        console.log("Birds "+usageCount);
                        //setUsageCount(uCount);
                        newRecords = true;
                        console.log("Usage "+["U",generateDateTimeString(readData[1],readData[2],readData[3],readData[4],readData[5]),readData[6]-127, calculation(readData[8],readData[9]),calculation(readData[10],readData[11]),readData[12],readData[13],readData[14],readData[15],256*address[0]+address[1]]);
                        usageArray.push(["U",generateDateTimeString(readData[1],readData[2],readData[3],readData[4],readData[5]),readData[6]-127, calculation(readData[8],readData[9]),calculation(readData[10],readData[11]),readData[12],readData[13],readData[14],readData[15],256*address[0]+address[1]]);
                        console.log("Array So Far "+usageArray);
                      }
                      if(readData[0] == 173)
                      {
                        questionCount++;
                        console.log("Bees "+questionCount);
                                        //setQuestionCount(qCount);
                        newRecords = true;
                        console.log("Answer "+["A",generateDateTimeString(readData[1],readData[2],readData[3],readData[4],readData[5]),answers[readData[6]],answers[readData[7]],answers[readData[8]],answers[readData[9]],answers[readData[10]],256*address[0]+address[1]]);  
                        usageArray.push(["A",generateDateTimeString(readData[1],readData[2],readData[3],readData[4],readData[5]),answers[readData[6]],answers[readData[7]],answers[readData[8]],answers[readData[9]],answers[readData[10]],256*address[0]+address[1]]);
                        console.log("Arrayy Soo Fffar "+usageArray);
                      }
                         console.log("Usage "+usageCount+" Question "+questionCount);
                    //}
                    if((256*address[0]+address[1]-16) == lastUploadAddress)
                    {
                      console.log("Go To Preset Data");
                      AsyncStorage.setItem("lastAddress",(256*address[0]+address[1]).toString());
                      
                      return resolve([2,999,999]);
                    }
                    return resolve([3,999,999]);
                   }
                   else
                   {                           
                      
                      console.log("Uploading Data To Server! For Device "+currentUserData.serialnumber);
                      setScanStatus("Uploading Data To Server");
                      setScanAddress("");
                      //console.log("Here we do "+lastUsageAddress);
                      
                      //return;
                      var jsonData = "{";
                      jsonData += '"SerialNumber":"'+currentUserData.serialnumber+'","UserInfo":{"PatientName":"'+currentUserData.name+'","PatientEmail":"'+currentUserData.email+'","DoctorEmail":"'+currentUserData.doctorEmail+'","DeviceName":"Avid IF2"},';
                      jsonData += '"Usage":[';
                      for(var i = 0; i < usageArray.length;i++)
                      {
                        if(usageArray[i][0] == "U")
                        {
                          console.log("Date Is "+usageArray[i][1][0]);
                          jsonData += '["'+usageArray[i][0]+'",["'+usageArray[i][1][0]+'","'+usageArray[i][1][1]+'"],'+usageArray[i][2]+','+usageArray[i][4]+','+usageArray[i][3]+','+usageArray[i][5]+','+usageArray[i][6]+','+usageArray[i][7]+','+usageArray[i][8]+','+usageArray[i][9]+']';
                        }
                        else
                        {
                          jsonData += '["'+usageArray[i][0]+'",["'+usageArray[i][1][0]+'","'+usageArray[i][1][1]+'"],';
                     
                          for(var j = 2;j<8;j++)
                          {
                            if(isNaN(usageArray[i][j]))
                              jsonData += '"'+usageArray[i][j]+'"';
                            else
                              jsonData += usageArray[i][j];
                            if(j != 7)
                              jsonData+= ",";
                            else
                              jsonData+= "]";
                          }
                        }
                        if(i != usageArray.length - 1)
                          jsonData += ",";
                 
                      }
                      jsonData += '],';
                      jsonData+= '"Config":["'+configArray[0]+'","'+configArray[1]+'","'+configArray[2]+'","'+configArray[3]+'","'+configArray[4]+'"]';
                      jsonData += ',"Preset":[';
                      for(var i = 0;i<masterPresetArray.length;i++)
                      {
                        jsonData += '["'+masterPresetArray[i][0]+'","'+masterPresetArray[i][1]+'","'+masterPresetArray[i][2]+'","'+masterPresetArray[i][3]+'","'+masterPresetArray[i][4]+'","'+masterPresetArray[i][5]+'","'+masterPresetArray[i][6]+'","'+masterPresetArray[i][7]+'","'+masterPresetArray[i][8]+'"]';
                        if(i != masterPresetArray.length - 1)
                          jsonData += ",";
                      }
                      jsonData+=']';
                      jsonData += "}";
                      //console.log(jsonData);
                      console.log("Final Data Is "+JSON.stringify(jsonData));
                 
                   /*
                   token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VyTmFtZSI6InJ1c3NlbGxfam93ZWxsIiwiaGFzaCI6Ijk5NDVhOGM3MzQwYzNlZWY1YmZjNmIwYzQ5NTQ5YmIzIiwiUGVybWlzc2lvbiI6NSwiaWF0IjoxNjc0NTAxNzk4LCJleHAiOjE2NzczODE3OTh9.69wZGgeSBXvaPmxXu7URgXhYu_-ZfZjUis1oxu32EYg
                     action=insertData
                     dataJson={"SerialNumber":"F001451","Usage":[["U",["Oct. 12 2022","06:15 PM"],0,0,0,0,0,0,0,0],["A",["Oct. 12 2022","06:20 PM"],0,0,0,0,0,0]],"Preset":[[0,0,0,0,0,0,0,0,0]],"Config":[2,2,2,2,2],"UserInfo":{"PatientName":"Russell Jowell","PatientEmail":"russ.jowell@gmail.com","DoctorEmail":"russdoctor@medical.com","DeviceName":"Avid IF2"}}
                   */
                  console.log("Token Is "+currentUserData.token);
                   
                   const dataRequestOptions = {
                   
                     method:'POST',
                     headers: {'x-access-token':currentUserData.token},
                     body: 'action=insertData&dataJson='+jsonData+'&appversion='+appVersion
                     //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
                 
                 
                   };

                   const dataRequestOptionsAA = {
                             
                    method:'POST',
                    headers: {'x-access-token':currentUserData.token,'Content-Type': 'application/json'},
                    //body: 'action=insertData&dataJson='+jsonData+'&appversion='+appVersion
                    body: JSON.stringify({action:"insertData",dataJson:jsonData,appversion:appVersion})
                    //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
                
                
                  };
                   
                   console.log(dataRequestOptions.body);
                   console.log("Cheese Puffs are GREAT!!");
                   //fetch('https://avid.vqconnect.io/nodejs/deviceList',dataRequestOptions).then((response)=>response.json()).then((responseJson)=>{
                    fetch(webURLS.deviceList,dataRequestOptionsAA).then((response)=>response.json()).then((responseFromJson)=>  { 
                    
                    if(responseFromJson.code == 200)
                    { 
                      console.log("Yessssir "+JSON.stringify(responseFromJson));
                      AsyncStorage.getItem("lastDeviceAddress").then((value)=>{
                        console.log("The Stuff IS This "+value);
                        setLastUploadAddress(value);
                        console.log("Device Address "+lastUploadAddress+" "+value)
                        AsyncStorage.getItem("userDeviceInfo").then((deviceJSON)=>JSON.parse(deviceJSON)).then((deviceInfo)=>{
                        deviceInfo.lastuserdata.Address = value;
                        console.log("The New Address Is "+value);
                        return deviceInfo;
                      }).then((deviceInformation)=>{
                        AsyncStorage.setItem("userDeviceInfo",JSON.stringify(deviceInformation)).then(()=>{console.log("Success! Written")}).catch((error)=>{console.log("Update ErrorAA "+error)});

                      });
                    });
                    //AsyncStorage.setItem("lastAddress",lastUsageAddress.toString());
                    //BleManager.disconnect(peripheral.id).then(()=>{});  
                    return resolve([4,questionCount,usageCount]);
                    }
                    else
                    {
                      Alert.alert("Notice","Upload Error");
                    }
                    
                   
               }).catch((error)=>{Alert.alert("Notice","Upload Error - 3");console.log("Upload Error "+error);
      
              return reject("Upload Error. Sorry");
            });
                  return;
                
                
                
                
                
                
                
                
                   }
              });
            },400);}
          }).catch((error)=>{console.log("Write ERror "+error)});
        });
      });


      }).then((returnVal)=>{

      switch(returnVal[0])
      {
       //Initial Read
       case 0:
         if(returnVal[2] == 0)
           return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[returnVal[1]-1,0]);
         else
           return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[returnVal[1],returnVal[2]-16]);
       case 1:
         if(address[1] == 0)
           return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[address[0]-1,240]);
         else
           return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[address[0],address[1]-16]);
         //break;
       case 2:
         return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[3,96]);
       case 3:
         //setUsageCount(returnVal[1]);
         //setQuestionCount(returnVal[2]);
         if(address[1] == 0)
             return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[address[0]-1,240]);
         else
             return getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[address[0],address[1]-16]);
       case 4:
        var nowTime= new Date();
        let dateMessage = [128,Number(nowTime.getYear()-100),Number((nowTime.getMonth())+1),Number(nowTime.getDate()),Number(nowTime.getHours()),Number(nowTime.getMinutes()),Number(nowTime.getSeconds())];    
        return getDeviceData(peripheral,bluetoothIDs.svc_1110,bluetoothIDs.chr_1111,bluetoothIDs.chr_1111,dateMessage);

       default:
          console.log("The Stuff Was "+returnVal);
          return(returnVal);
         //console.log("The id for this is "+peripheral.id);
         //BleManager.disconnect(peripheral.id);
         //console.log("Eggplants");
         
         //console.log("Eggplants1");  
         //let dateMessage = [128,Number(nowTime.getYear()-100),Number((nowTime.getMonth())+1),Number(nowTime.getDate()),Number(nowTime.getHours()),Number(nowTime.getMinutes()),Number(nowTime.getSeconds())];
        //console.log("The Time Msg "+dateMessage);
         
        
        /*
        BleManager.connect(peripheral.id).then(()=>{

           BleManager.retrieveServices(peripheral.id,[bluetoothIDs.svc_1110]).then((peripheralInfo)=>{

             BleManager.write(peripheral.id,bluetoothIDs.svc_1110,bluetoothIDs.chr_1111,dateMessage).then(()=>{
               console.log("Write New Time Success");
               setLastUploadTime(""+(currentDate.getYear()+1900)+"-"+(currentDate.getMonth()+1+"-"+(currentDate.getDate())));
               console.log("Big Mac With Cheese");
               BleManager.disconnect(peripheral.id);
               return(["Success",returnVal[1],returnVal[2]]);

             }).catch((error)=>{showNotification("Error 1 ",error)});

           }).catch((error)=>{showNotification("Error 2",error)});


         }).catch((error)=>{showNotification("Error 3",error)});*/
        

         
      }



    }).catch((error)=>{console.log("There was problem "+error);return("Uh Oh");})
  }

  function handleDiscoverDevice(peripheral)
  {
    console.log("Device isss "+currentDeviceString);
    if(peripheral.name != null && peripheral.advertising.localName == "Avid "+currentDeviceString)
    {
      BleManager.stopScan();
      setScanStatus("Reading Data from Device - Please Wait "+currentDeviceString);
      setScanCycleActive(true);
      getDeviceData(peripheral,bluetoothIDs.svc_1130,bluetoothIDs.chr_1131,bluetoothIDs.chr_1132,[0,0]).then((result)=>{
        BleManager.disconnect(peripheral.id);
        setScanStatus("");
        setIsUpdating(false);
        
        
        var theDate = new Date();
        console.log("Hello Dolly");
        console.log(theDate.getMonth()+" "+(theDate.getYear()+1900));
        updateCalendar([theDate.getMonth()+1,theDate.getYear()+1900]);
        console.log("Goodbye Dolly");
        console.log("Is Updating Is "+isUpdating);
        setIsScanning(false);
        console.log("Is Scanning Is "+isScanning);
        setScanButtonColor("white");
        setScanButtonOpacity(1.0);
        
            if(result[0] == "Success")
              Alert.alert("Notice","Upload Successful! Device has been disconnected and is ready for use.");
            else 
              Alert.alert("Notice - Failure",result[1]);
          
          console.log("Things were a succes! ");
          console.log(result);
      }).catch((error)=>{console.log("Oops "+error);})
    }
  } //End handleDiscoverDevice

  function updateCalendar(dayInfo)
  {
    setIsUpdating(true);
    console.log("What is The Day AA "+dayInfo);
    console.log("The Day Is "+dayInfo[0]+" "+dayInfo[1]+" "+currentUserData);
    getMonthUsageData(dayInfo[0],dayInfo[1]).then((result)=>{

      console.log("Months Updated");
      console.log(result);
      updateMarkedDates(result);
      console.log("The new marked dates are "+markedDates);
      setIsUpdating(false);

    }).catch((error)=>{console.log("Probbbb "+error)});
  } //End updateCalendar

 

    
    function startDeviceScan()
    {
      setIsUpdating(true);
      setIsScanning(true);
      setScanButtonColor("#bbb");
      setScanButtonOpacity(0.3);
      setScanStatus("Scanning for Device");
      setScanStatus("test message");
      BleManager.scan([],scanTimeout,false);
    }

  

//#fad7ed

  

  AsyncStorage.getItem("currentUserData").then((userDataIn)=>JSON.parse(userDataIn)).then((userData)=>{
    //console.log("The NAme Is "+userData.uid);
    if(!userData)
      console.log("No User Data loaded!");
    if(!markedDates)
    {
        var theDate = new Date();
        //console.log("Hello Dolly");
        console.log("The current date is "+theDate.getMonth()+" "+(theDate.getYear()+1900));
        updateCalendar([theDate.getMonth()+1,theDate.getYear()+1900]);
    }
      //console.log("There are no marked dates");
    //setCurrentUserInfo(userData);
    console.log("Cheeses1")
    setCurrentDeviceString(userData.serialnumber == ''?"No Device Paired":userData.serialnumber);
    console.log("cheeses2 "+currentDeviceString+" "+currentUserData.serialnumber);

    if(!scanCycleActive)
      setScanButtonColor(userData.serialnumber == ''?"#bbb":"#fff");
    if(scanStatus == "" && !scanCycleActive)
      setScanButtonOpacity(userData.serialnumber == ''?0.3:1.0);
    navigation.setOptions({headerStyle:{backgroundColor:avidPurpleHex},headerTintColor:'white',headerTitle:"Welcome, "+userData.name,headerRight:()=>(<ActivityIndicator alignSelf='center' color="white" animating={isUpdating}/>)});
    setIsScanning(userData.serialnumber=='');
    console.log("Value Is "+isScanning);
    return;
  
  });


  AsyncStorage.getItem("userDeviceInfo").then((deviceJSON)=>JSON.parse(deviceJSON)).then((deviceInfo)=>{
    console.log("Device Info Is This "+JSON.stringify(deviceInfo));
    setComplianceTimeString(deviceInfo.lastuserdata.ConfigData.ComplianceTime);
    if(lastUploadTime=='' || lastUploadTime < deviceInfo.lastdatatime.toString())
    {
      setLastUploadTime(deviceInfo.lastdatatime);
      //deviceInfo.lastdatatime = 
    }
      
    //else
    //  setLastUploadTime(deviceInfo.lastdatatime);
    console.log("The last Data time is "+deviceInfo.lastdatatime+" "+lastUploadTime);
    if(deviceInfo.lastuserdata.Address && lastUploadAddress == 896)
      setLastUploadAddress(deviceInfo.lastuserdata.Address);
      //setLastUploadAddress(2560);
    console.log("The Last Addresss was "+deviceInfo.lastuserdata.Address);
    return;

}).catch((error)=>{console.log("What was the error "+error)});

try
{
  if(lastUsageAddress == null)
    AsyncStorage.getItem("lastAddress").then((value)=>{lastUsageAddress = value;console.log("Value Is This Yes"+lastUsageAddress);}).catch((error)=>{console.log("Retrieve error");})
}
catch(error)
{
  console.log("Error Retrieving Last Address");
}

if(route.params.from == "login" && !auth().currentUser.emailVerified && !verifyShown)
{
  Alert.alert("E-mail Not Verified","Please check your e-mail to verify your account",[{text:'Resend E-mail',onPress:()=>{auth().currentUser.sendEmailVerification().then(()=>{

    Alert.alert("Notice","E-mail verification sent",[{text:"OK"}])

  }).catch((error)=>{

    Alert.alert("Notice","There was an error sending the verification e-mail "+error);

  });}},{text:"OK"}]);
  setVerifyShown(true);
}

function startDeviceScanButton(){

    
    
    
  setIsUpdating(true);
  setIsScanning(true);
  setScanCycleActive(true);
  console.log("Data Stuff "+isScanning);
  setScanButtonColor("#bbb");
  setScanButtonOpacity(0.3);
  setScanStatus("Scanning for Device");
  //setScanStatus("test message");
  bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
  bleManagerEmitter.removeAllListeners('BleManagerStopScan');
  bleManagerEmitter.addListener('BleManagerStopScan',(args)=>{
    setScanCycleActive(false);
    if(args.status == 10)
      Alert.alert("Notice","We could not detect your paired device",[{text:"OK",onPress:()=>{setIsScanning(false);setIsUpdating(false);setScanStatus("");}},{text:"Try Again",onPress:()=>{setScanCycleActive(true);BleManager.scan([],scanTimeout,false);}}]);
    })
  bleManagerEmitter.addListener('BleManagerDiscoverPeripheral',(peripheral)=>{handleDiscoverDevice(peripheral);})
  
  BleManager.scan([],scanTimeout,false);



//#fad7ed

}

return(

  <View style={{width:'100%',height:'100%',opacity:scanCycleActive?0.5:undefined}}>
    <Modal animationType='none' visible={scanCycleActive} transparent={true}  >
          <View style={styles.mainScreenModal}>
            <View style={styles.mainScreenModalView}>
          <Text style={{textAlign:'center', fontSize:25}}>{scanStatus}</Text>
          <Text style={{textAlign:'center', fontSize:16}}>{scanAddress}</Text>
          </View>
          <ActivityIndicator animating={true}/>
          </View>
          
        </Modal>
  <View style={{marginTop:'2%',marginHorizontal:'5%',marginBottom:'2%'}}>
  <View style={{flexDirection:'row'}}>{Circle("green",10)}<Text style={styles.grayButton}>&nbsp;&nbsp;Usage total time &gt;= 20</Text></View>
  <View style={{flexDirection:'row'}}>{Circle("purple",10)}<Text style={styles.grayButton}>&nbsp;&nbsp;Usage total time &lt; 20</Text></View>
  <View style={{flexDirection:'row'}}>{Circle("red",10)}<Text style={styles.grayButton}>&nbsp;&nbsp;All questions are answered</Text></View>
  <View style={{flexDirection:'row'}}>{Circle("pink",10)}<Text style={styles.grayButton}>&nbsp;&nbsp;Some Questions Skipped</Text></View>
  </View>
  <Calendar hideExtraDays={true} theme={{textDayFontSize:17}} style={{height:'55%',marginBottom:'0.5%'}} markedDates={markedDates}  onDayPress={day=>{console.log("The Day Is "+day.dateString);if(day.dateString in markedDates){navigation.navigate("USAGE SUBSTACK",{currentDate:day.dateString,from:"calendar"});}  }} onMonthChange={month => {console.log("Month Is This"+month);/*setCurrentMonth([month.month,month.year]);*/updateCalendar([month.month,month.year]);/*setDatesUpdated(false);*/}} markingType={'multi-dot'}></Calendar>
  <View style={{marginTop:'0'}}>
  <Text style={[styles.grayButton,{fontSize:18,alignSelf:'center'}]}>Compliance Time:{complianceTimeString}</Text>
  
  <TouchableOpacity disabled={isScanning || scanCycleActive} alignSelf='center' onPress={()=>{Alert.alert("Prepare To Connect","Please ensure your paired AVID device is turned on and Bluetooth mode is activated",[{text:"OK",onPress:startDeviceScanButton}]);}} style={{opacity:scanButtonOpacity, alignSelf:'center', marginTop:'3%',marginBottom:'0%', backgroundColor: "#722053", width:"80%" }}><Text style={{ fontFamily: "Proxima Nova",fontWeight:'bold',color:scanButtonColor, textAlign: 'center', fontSize: 25, margin:10, }}>Sync Device Data</Text></TouchableOpacity>
  <View style={{flexDirection:'row',alignItems:'center',alignSelf:'center',marginTop:'5%'}}><View style={{alignItems:'center'}}><Text style={[styles.grayButton,{fontSize:21}]}>Current Device:</Text><Text style={[styles.grayButton,{fontSize:17}]}>{currentDeviceString}</Text></View><View style={{marginLeft:'5%'}}></View><View style={{alignItems:'center'}}><Text style={[styles.grayButton,{fontSize:21}]}>Last Upload Time:</Text><Text style={[styles.grayButton,{fontSize:17}]}>{moment(lastUploadTime,'YYYY-MM-DD').format('MMM DD, YYYY')}</Text></View></View>
  {/*<Text style={[styles.grayButton,{alignSelf:'center',fontSize:20,marginTop:'1%'}]}>Your Current Device: {currentDeviceString}</Text>
  <Text style={[styles.grayButton,{alignSelf:'center',fontSize:23}]}>{currentDeviceString}</Text>
  
  <Text style={{fontSize:17,color:'grey',alignSelf:'center'}}>{scanStatus}</Text>
  <Text style={[styles.grayButton,{alignSelf:'center',fontSize:20,marginTop:'0%'}]}>Last Upload Time: {moment(lastUploadTime,'YYYY-MM-DD').format('MMM DD, YYYY')}</Text>
  */}{/*<Text style={[styles.grayButton,{alignSelf:'center',fontSize:18}]}>{moment(lastUploadTime,'YYYY-MM-DD').format('MMM DD, YYYY')}</Text>*/}
  </View>
  </View>
  
  );
  
} //End MainScreen

const LoginScreen = ({route,navigation}) =>
//function LoginScreen(route,navigation)
{
    const eyeCloseIcon = "./images/eyesclose.jpg";
    const eyeOpenIcon = "./images/eyesopen.jpg";
    //const navigation = useNavigation();
    const [username,setUsername]= React.useState("");
    const [password,setPassword]= React.useState("");
    const [eyeIcon,setEyeIcon] = React.useState(require(eyeCloseIcon));
    const [secureTextOn,setSecureTextOn] = React.useState(true);
    const [usernameSet,setUsernameSet] = React.useState(false);
    const [isLoading,setIsLoading] = React.useState(false);
    const [loginProcessStaus,setLoginProcessStatus] = React.useState("");


    function finishLogin(usernameIn,passwordIn,requestOptions)
    {
        function retrieveData()
        {
          setLoginProcessStatus("Fetching Usage Data");
          fetch(webURLS.deviceList+"?action=findUsageData&SerialNumber="+currentUserData.serialnumber+"&token="+currentUserData.token).then((response)=>response.json()).then((responseJson)=>{
            userDeviceInfo = responseJson.data.status == 2 ? responseJson.data:"null";
            console.log("Step A");
            if(userDeviceInfo == "null" || userDeviceInfo.lastuserdata == null)
            {
              console.log("Step B");
              navigation.navigate("Main",{calendarInfo:{},serialNumber:currentUserData.serialnumber,from:"login"});
            }
            else
            {
              AsyncStorage.setItem("lastUploadAddress",userDeviceInfo.lastuserdata.Address.toString());
              console.log("Step C");
              AsyncStorage.setItem("lastUploadDate",userDeviceInfo.lastdatatime.toString());
              console.log("Step D");
              AsyncStorage.setItem("userDeviceInfo",JSON.stringify(userDeviceInfo));
              console.log("Step E");

              getMonthUsageData(new Date().getMonth()+1,new Date().getFullYear()).then((result)=>{
                console.log("Step F "+JSON.stringify(result)+" "+navigation);
                setIsLoading(false);
                console.log("Step G");
                setLoginProcessStatus("");
                console.log("Step H");
                analytics().logLogin({method:"standard"});
                navigation.navigate("Main",{calendarInfo:result,serialNumber:currentUserData.serialnumber,from:"login"});
              }).catch((error)=>{
                console.log("There Was Problem "+error);
                auth().signOut().then(()=>{AsyncStorage.removeItem("currentUserData").then(()=>{Alert.alert("Network Error","Please Try Again");});})
              });
            }
          }).catch((error)=>{
            console.log("The Error "+error);
            if(error.name == "SyntaxError")
            {
              console.log("Georgeio");
              if(auth().currentUser)
                auth().signOut();
              //console.log(auth().currentUser);
              setIsLoading(false);
              setLoginProcessStatus("");
              Alert.alert("Network Error","Please Try Again");
              return;
            }
          });
        } //End retrieveData

        AsyncStorage.setItem("username",usernameIn);
        setUsername(usernameIn);

        fetch(webURLS.login,requestOptions).then((response)=>response.json()).then((responseJson)=>{
          switch(responseJson.code)
          {
            case 200:
              currentUserData = responseJson.data;
              console.log("Egg Rolls and Rice "+JSON.stringify(currentUserData));
              AsyncStorage.setItem("currentUserData",JSON.stringify(responseJson.data));
              //AsyncStorage.getItem("currentUserData").then((theData)=>{console.log("The Data Is "+theData)}).catch((error)=>{console.log("There was a problem "+error);});
              AsyncStorage.setItem("username",usernameIn);  
              if(!auth().currentUser)
                auth().createUserWithEmailAndPassword(responseJson.data.email.toLowerCase(),passwordIn).then((userCredential)=>{
                  userAccountPtr.doc(usernameIn.toLowerCase()).set({eMail:responseJson.data.email.toLowerCase(),md5pass:responseJson.data.PassHash});
                  auth().currentUser.sendEmailVerification().then(()=>{console.log("E-mail success");retrieveData();})
                //return;
                }).catch((error)=>{console.log("Erris is "+error);
            
                auth().signInWithEmailAndPassword(responseJson.data.email.toLowerCase(),passwordIn).then(()=>{retrieveData();})
            
              });
              else
                retrieveData();
              break;
            case 201:
                //User Deleted
              setIsLoading(false);
              setLoginProcessStatus("");
              Alert.alert("Username Error","This user has been deleted. Please contact VQ OrthoCare for support");
              break;

            case 203:
              setIsLoading(false);
              setLoginProcessStatus("");      
              Alert.alert("Login Error","Password Incorrect");
              break;      
              
            case 205:
              setIsLoading(false);
              setLoginProcessStatus("");    
              Alert.alert("Username Error","Username does not exist");
              break;
              

          }
        }).catch((error)=>{
          if(error.name == "SyntaxError")
          {
            console.log("Georgeio");
            if(auth().currentUser)
              auth().signOut();
            console.log(auth().currentUser);
            setIsLoading(false);
            setLoginProcessStatus("");
            Alert.alert("Network Error","Please Try Again"); 
          }
        });



    } //End finishLogin


    async function processLogin(usernameIn,passwordIn)
    {
      if(auth().currentUser)
        await auth().signOut();
        
      console.log("Step 3")  
      var requestOptions;

      userAccountPtr.doc(usernameIn.toLowerCase()).get().then((document)=>{
        if(document.exists)
        {
          console.log("Step 4") 
          auth().signInWithEmailAndPassword(document.data().eMail,passwordIn).then((userCredential)=>{
            console.log("Step 8 "+document.data().md5pass+" "+appVersion);
            requestOptions = {
              method:'POST',
              headers: new Headers({'Content-Type': contentTypeString}),
              body: 'action=signIn&whereJson='+JSON.stringify({"username":usernameIn,"md5password":document.data().md5pass,"password":"NULL"})+'&appversion='+appVersion
              //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
            };
            console.log("Step 5"); 
            finishLogin(usernameIn,passwordIn,requestOptions);

          }).catch(error=>{
                console.log(error.code);
                  setLoginProcessStatus(""); 
                  if(error.code == "auth/wrong-password")
                  {
                    setIsLoading(false);
                    Alert.alert("Login Error","Password Incorrect");
                    return;
                  }


          });
        }
        else
        {
          console.log("Doesnt exist");
          requestOptions = {
              method:'POST',
              headers: new Headers({'Content-Type': contentTypeString}),
              body: 'action=signIn&whereJson='+JSON.stringify({"username":usernameIn,"password":passwordIn})+'&appversion='+appVersion
           };
          finishLogin(usernameIn,passwordIn,requestOptions);
        }
      });
    } //End processLogin

    function checkFieldInputs()
    {
        setIsLoading(true);
        setLoginProcessStatus("Logging In");
        console.log("poopyyy");
      
        if(username == "")
        {
          setLoginProcessStatus(""); 
          setIsLoading(false);
          if(password == "")
          {
            Alert.alert("Input Error","Username & Password are blank");
            return;
          }
          else
          {
            Alert.alert("Input Error","Username is blank");
            return;
          }
          
        }
        else if(password == "")
        {
          setLoginProcessStatus(""); 
          setIsLoading(false);
          Alert.alert("Input Error","Password is blank");
        }
        else
          processLogin(username,password);
        
    } //End checkFieldInputs

    
    if(!usernameSet)
    {
      AsyncStorage.getItem("username").then((username)=>{
        if(username)
        {
          setUsername(username);
          setUsernameSet(true);
        }
        return;
      });
    }
    
   return(<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.loginScreen}>
    
      <Image style={styles.loginScreenImage} source={require("./images/AVID.jpg")} />
      
    <View style={{width: '85%'}}>
    
    <Text style={styles.loginLabels}>Username</Text>
    <TextInput InputProps={{disableUnderline: false}} style={styles.textFields} onChangeText={(text)=>setUsername(text)} value={username} name='usernameField'></TextInput>
    <Text style={styles.loginLabels}>Password</Text>
    <View style={{width:'100%',flexDirection:'row'}}>
    <TextInput secureTextEntry={secureTextOn} style={[styles.textFields,{flex:10}]} onChangeText={(text)=>setPassword(text)} value={password} name='passwordField'></TextInput>
    
    <TouchableHighlight onPress={()=>{console.log("boobs");setSecureTextOn(!secureTextOn);if(secureTextOn){setEyeIcon(require(eyeOpenIcon));}else{setEyeIcon(require(eyeCloseIcon));}}}><Image style={{flex:0}} source={eyeIcon}/></TouchableHighlight>
    </View>
    <View style={{flexDirection: "row",marginTop: 10, width:'100%',justifyContent:'space-between'}}>
    <TouchableOpacity onPress={()=>{setLoginProcessStatus(""); setIsLoading(false);navigation.navigate("Forgot Username")}}><Text style={styles.grayButton}>Forgot Username?</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>{setLoginProcessStatus(""); setIsLoading(false);navigation.navigate("Forgot Password")}}><Text style={styles.grayButton}>Forgot Password?</Text></TouchableOpacity>
    
    </View>
    </View>
   
    
    <TouchableOpacity onPress={()=>{checkFieldInputs(username,password);}} style={{ marginTop:30,marginBottom:20, backgroundColor: '#722053', width:"80%" }}><Text style={{ fontFamily: "Proxima Nova",fontWeight:'bold',color: '#fff', textAlign: 'center', fontSize: 25, margin:10, }}>Login</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>{navigation.navigate("Sign Up") }}><Text style={[styles.purpleButton,{marginTop:'6%'}]}>Sign Up</Text></TouchableOpacity>
    <Text>&nbsp;&nbsp;&nbsp;</Text>
    <ActivityIndicator animating={isLoading}/>
    <Text style={{color:'grey',fontSize:10}}>{loginProcessStaus}</Text>
    </View></TouchableWithoutFeedback>)
} //End LoginScreen

const UsageDetailScreen = ({route,navigation}) =>
{
  const currentData = route.params.dataObject;

  return(
    <View style={{width:'100%'}}>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Date</Text><Text style={styles.usageDetailData}>{currentData.DateOfTreatment}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Time</Text><Text style={styles.usageDetailData}>{currentData.TimeOfTreatment}</Text></View>
    {route.params.isUsage == true &&
    <View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Preset</Text><Text style={styles.usageDetailData}>{currentData.PresetNumber}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Device Pause Time</Text><Text style={styles.usageDetailData}>{currentData.MinOfPause}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Channel 1 max Amp used</Text><Text style={styles.usageDetailData}>{currentData.Channel1MaxAmpUsed}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Channel 1 average Amp used</Text><Text style={styles.usageDetailData}>{currentData.Channel1AverageAmpUsed}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Channel 2 max Amp used</Text><Text style={styles.usageDetailData}>{currentData.Channel2MaxAmpUsed}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Channel 2 average Amp used</Text><Text style={styles.usageDetailData}>{currentData.Channel2AverageAmpUsed}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Minutes of Use</Text><Text style={styles.usageDetailData}>{currentData.MinOfUse}</Text></View>
</View>}
{route.params.isUsage == false &&
<View>
  <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Q1 Pain Before</Text><Text style={styles.usageDetailData}>{currentData.PainBefore}</Text></View>
  <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Q2 Decr Meds</Text><Text style={styles.usageDetailData}>{currentData.DecrMeds}</Text></View>
  <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Q3 Help Work</Text><Text style={styles.usageDetailData}>{currentData.HelpWork}</Text></View>
  <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Q4 Help Home</Text><Text style={styles.usageDetailData}>{currentData.HelpHome}</Text></View>
  <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Q5 Pain After</Text><Text style={styles.usageDetailData}>{currentData.PainAfter}</Text></View>
</View>


}
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Address</Text><Text style={styles.usageDetailData}>{currentData.Address}</Text></View>
    <View style={styles.usageDataDetailCell}><Text style={styles.usageDetailLabels}>Upload Time</Text><Text style={styles.usageDetailData}>{currentData.uploadTime}</Text></View>
    
    </View>

  );
} //End UsageDetailScreen

const ForgotPasswordScreen = ({route,navigation}) =>
{
  const [emailInput,setEmailInput] = React.useState("");
  const [buttonPressed,setButtonPressed] = React.useState(false);
  const [passwordStatus,setPasswordStatus] = React.useState("");
  const [passwordEntry,setPasswordEntry] = React.useState("");
  const [confirmEntry,setConfirmEntry] = React.useState("");

  const confirmPassRef = useRef();

  function resetPassword(eMailInput)
  {
    if(eMailInput == "")
    {
      Alert.alert("E-mail Error","E-mail field is blank");
      return;
    }

    auth().signInWithEmailAndPassword(eMailInput,"tespw").then((result)=>{console.log("success!!");}).catch((error)=>{

      if(error.code == "auth/invalid-email")
        Alert.alert("Error","Invalid E-mail format");

      if(error.code == "auth/wrong-password")
      {
        const requestOptions = {
      
          method:'POST',
          headers: new Headers({'Content-Type':contentTypeString}),
          body: 'action=findEmail&whereJson='+JSON.stringify({"email":eMailInput})+'&appversion='+appVersion
          //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
      
        };

        fetch(webURLS.login,requestOptions).then((response)=>response.json()).then((responseJson)=>{
          if(responseJson.code == "200")
            setButtonPressed(true);
          else
            Alert.alert("E-mail Error","E-mail not found");
        }).catch((error)=>{
          
          if(error.name == "SyntaxError")
          {
            Alert.alert("Network Error","Please Try Again");
            return;
          }
        });
      }
      

    })
  }//End resetPassword function

function processPassword()
{
  console.log("cheesey");
  
  
  if(emailInput == "")
  {
    Alert.alert("Error","E-mail is blank");
    return;
  }
  
  
  
  if(passwordEntry == "" || confirmEntry == "")
  {
    Alert.alert("Error","One field is empty");
    return;
  }
  console.log("Hello");
  if(passwordEntry != confirmEntry)
  {
    Alert.alert("Error","Passwords do not match");
    //setPasswordStatus("Passwords do not match!");
    return;
  }
  console.log("PArt 55");
  const requestOptions = {
      
    method:'POST',
    headers: new Headers({'Content-Type': contentTypeString}),
    body: 'action=changepassword&whereJson='+JSON.stringify({"email":emailInput,"password":passwordEntry})+'&appversion='+appVersion
    //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion


  };

  fetch(webURLS.log,requestOptions).then((response)=>response.json()).then((responseJson)=>{

    if(responseJson.code == 200)
    {
      Alert.alert("Success","Password Successfully Updated.",[{text:"OK",onPress:()=>{navigation.navigate("Login");}}]);
      //Alert.alert("E-mail Not Verified","Please check your e-mail to verify your account",[{text:'Resend E-mail',onPress:()=>{userCredential.user.sendEmailVerification();}},{text:"OK"}]);
      console.log("Password Success!");
      //setPasswordStatus("Password Successfully Changed");
    }
    else
    {
      Alert.alert("Error","There was an error resetting your password.");
      console.log("Password Fail");
      //setPasswordStatus("User Not Found!");
    }

  });



}//End processPassword

return( 
  <KeyboardAwareScrollView style={{backgroundColor:'white'}} contentContainerStyle={{backgroundColor:'white'}}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{height:'50%'}}>
  <View style={styles.loginScreen}>
    <Text style={[styles.loginLabels,{textAlign:'center',marginBottom:'15%',marginTop:'10%'}]}>Please enter your e-mail address{"\n"}to change your password</Text>
    <TextInput returnKeyType='go' onSubmitEditing={()=>{resetPassword(emailInput)}} onChangeText={(text)=>setEmailInput(text)} value={emailInput} style={[styles.textFields,{width:'80%'}]}></TextInput>
    <TouchableOpacity onPress={()=>{resetPassword(emailInput)}} style={{alignSelf:'center', marginTop:30,marginBottom:50, backgroundColor: '#722053', width:"80%" }}><Text style={{ fontFamily: "Proxima Nova",fontWeight:'bold',color: '#fff', textAlign: 'center', fontSize: 25, margin:10, }}>Submit</Text></TouchableOpacity>
    
    {buttonPressed == true && <View style={{width:'100%',alignItems:'center'}}><Text>Please enter your new password</Text>
    <TextInput returnKeyType='next' onSubmitEditing={()=>{confirmPassRef.current.focus();}} onChangeText={(text)=>setPasswordEntry(text)} value={passwordEntry} style={[styles.textFields,{width:'80%'}]}></TextInput>
    <Text>Confirm your new password</Text>
    <TextInput ref={confirmPassRef} onSubmitEditing={()=>{processPassword()}} returnKeyType='done' onChangeText={(text)=>setConfirmEntry(text)} value={confirmEntry} style={[styles.textFields,{width:'80%'}]} autoCorrect={false} spellCheck={false}></TextInput><Text style={{color:'red'}}>{passwordStatus}</Text><TouchableOpacity onPress={()=>{processPassword()}} style={{ marginTop:30,marginBottom:50, backgroundColor: '#722053', width:"80%" }}><Text style={{ fontFamily: "Proxima Nova",fontWeight:'bold',color: '#fff', textAlign: 'center', fontSize: 25, margin:10, }}>Reset Password</Text></TouchableOpacity>
</View>}
    
</View></TouchableWithoutFeedback></KeyboardAwareScrollView>);
} //End ForgotPasswordScreen

const ForgotUsernameScreen = ({route,navigation}) =>
{
  const [forgotUsernameText,setForgotUsernameText] = React.useState("");
  const [eMailInput,setEmailInput] = React.useState("");

  function findUsername(eMailInput)
  {
    if(eMailInput == "")
    {
      setForgotUsernameText("E-mail is blank");
      return;
    }

    const requestOptions = {
      
      method:'POST',
      headers: new Headers({'Content-Type': contentTypeString}),
      body: 'action=newSendUsername&whereJson='+JSON.stringify({"email":eMailInput})+'&appversion='+appVersion
      //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
  
  
    };

    fetch('https://avid.vqconnect.io/nodejs/login',requestOptions).then((response)=>response.json()).then((responseJson)=>{

    if(responseJson.code==200)
    {
      setForgotUsernameText("Your Username Is: \n"+responseJson.data.username);
    }
    else
    {
      setForgotUsernameText("E-mail not found");
    }

  });

  
  }//End findUsername

  return(<View style={styles.loginScreen}>
    <Text style={[styles.loginLabels,{textAlign:'center',marginBottom:'15%'}]}>Please enter your e-mail address{"\n"}to retrieve your username</Text>
    <TextInput onChangeText={(text)=>setEmailInput(text)} value={eMailInput} style={[styles.textFields,{width:'80%'}]}></TextInput>
    <TouchableOpacity onPress={()=>{findUsername(eMailInput)}} style={{ marginTop:30,marginBottom:50, backgroundColor: '#722053', width:"80%" }}><Text style={{ fontFamily: "Proxima Nova",fontWeight:'bold',color: '#fff', textAlign: 'center', fontSize: 25, margin:10, }}>Submit</Text></TouchableOpacity>

    <Text style={{textAlign:'center',fontSize:15}}>{forgotUsernameText}</Text>
  </View>);
} //End ForgotUsernameScreen

const DeviceSelection = ({route,navigation}) =>
{
  function checkIfDeviceIsRegistered(serial_number)
  {
    console.log("Hello 33");
    
    return new Promise(function(resolve,reject){
    const dataRequestOptions = {
  
      method:'POST',
      headers: new Headers({
        'Content-Type': contentTypeString, // <-- Specifying the Content-Type
      }),
      body: 'action=checkDevice&serialNumber='+serial_number+'&appversion='+appVersion
      //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
    };

    fetch(webURLS.login,dataRequestOptions).then((response)=>response.json()).then((responseJson)=>{resolve(responseJson.msg);});});
  }

  bleManagerEmitter.addListener('BleManagerDidUpdateState',(state)=>{if(state.state != "on")Alert.alert("Bluetooth Error","Please ensure that Bluetooth on your phone is turned on");});
  BleManager.checkState();

  const [deviceList,setDeviceList] = React.useState([]);
  const [foundDevices,setFoundDevices] = React.useState([]); 
  const [isScanning,setIsScanning] = React.useState(false);
  const [alertShown,setAlertShown] = React.useState(false);
  const [foundDevice,setFoundDevice] = React.useState(false);
  const [isRegistering,setIsRegistering] = React.useState(false);
  const [firstModalShowing,setFirstModalShowing] = React.useState(true);
  const [isScanningA,setIsScanningA] = React.useState(false);
  const [registerStatus,setRegisterStatus] = React.useState("");

  navigation.setOptions({headerRight:()=>(<ActivityIndicator alignSelf='center' color="white" animating={isScanningA}/>)});
  if(!alertShown)
    Alert.alert("Device Selection","Please ensure that your desired AVID device is nearby, powered on, and that Bluetooth mode is active.",[{text:"OK",onPress:()=>{setAlertShown(true)}}]);

    function createNewUser(deviceID)
    {
      BleManager.stopScan();
      setIsRegistering(true);
      setRegisterStatus("Registering User");
      route.params.newUserInfo.serialNumber = deviceID;

      const newDataRequestOptions = {
        method:'POST',
        headers: new Headers({
          'Content-Type': contentTypeString, // <-- Specifying the Content-Type
        }),
        body: 'action=appsignup&whereJson='+JSON.stringify(route.params.newUserInfo)+'&appversion='+appVersion
        //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
      };

      fetch(webURLS.login,newDataRequestOptions).then((response)=>response.json()).then((responseJson)=>{
        setRegisterStatus("Recieved Response")
        if(responseJson.code == 200)
        {
          const loginRequestOptions = {
            method:'POST',
            headers: new Headers({'Content-Type': contentTypeString}),
            body: 'action=signIn&whereJson='+JSON.stringify({"username":route.params.newUserInfo.username,"password":route.params.newUserInfo.password})+'&appversion='+appVersion
          //        data:'action=signIn'+'&whereJson='+JSON.stringify({'username':username,'password':password})+'&appversion='+global.appVersion
          };
          setRegisterStatus("Signing In");
        console.log("Point F");
        console.log("step 111");
        fetch(webURLS.login,loginRequestOptions).then((response)=>response.json()).then((responseJson)=>{
          console.log("Point G");
          setRegisterStatus("Signed In");
          AsyncStorage.setItem("currentUserData",JSON.stringify(responseJson.data));
          auth().createUserWithEmailAndPassword(responseJson.data.email.toLowerCase(),route.params.newUserInfo.password).then((userCredential)=>{
            setRegisterStatus("Creating Firebase Record");
            userAccountPtr.doc(route.params.newUserInfo.username).set({eMail:responseJson.data.email.toLowerCase(),md5pass:responseJson.data.PassHash});
            auth().currentUser.sendEmailVerification().then(()=>{console.log("E-mail success");return;});
            //return;
          }).then(()=>{
        currentUserData = responseJson.data;  
        getMonthUsageData(new Date().getMonth()+1,new Date().getFullYear()).then((result)=>{

          //console.log(result);
          //setIsLoading(false);

          setRegisterStatus("Fetching Device Info");


          fetch(webURLS.deviceList+"?action=findUsageData&SerialNumber="+currentUserData.serialnumber+"&token="+currentUserData.token).then((response)=>response.json()).then((responseJson)=>{
            setRegisterStatus("Fetching Device Info - 1");
            console.log("Point H");
            AsyncStorage.setItem("userDeviceInfo",JSON.stringify(responseJson.data));
          userDeviceInfo = responseJson.data;  
          setIsRegistering(false);
          //auth().sendEmailVerification();
          navigation.navigate("Main",{calendarInfo:result,serialNumber:currentUserData.serialnumber});


          }).catch((error)=>{setIsRegistering(false);Alert.alert("Notice","Error 3 "+error);console.log("There was another problem "+error);});
          

        }).catch((error)=>{setRegisterStatus("The issue is as follows "+error)});}).catch((error)=>{setIsRegistering(false);Alert.alert("Notice","Network Error 2");console.log("Erris is "+error)});


        });



       



     
    }
    else
    {
      setIsRegistering(false);
      Alert.alert("Notice","There was an error "+responseJson.code+" "+responseJson.msg);
      console.log("There was a registration problem "+responseJson.code+" "+responseJson.msg);
    }
      }).catch((error)=>{setIsRegistering(false);Alert.alert("Notice","Network Error 1 "+error);});
    }

    const handleSelectFoundDevice = (peripheral) => {
      
      if(foundDevice != true)
        setFoundDevice(true);
      
      navigation.setOptions({headerRight:()=>(<ActivityIndicator alignSelf='center' color="white" animating={isScanning}/>)});
    onChanged = (e,name) =>{
  
      if(name.includes("Device Already Registered"))
        Alert.alert("Device Error","This device is already registered with another user.");
      else if(name.includes("Device Not Configured"))
        Alert.alert("Device Error","This device has not been configured yet. Please contact customer support");
      else
        Alert.alert("Confirm Device","Are you sure you want to register Device "+name+"?",[{text:'Yes',onPress:()=>{createNewUser(name.substring(0,7));}},{text:'No'}]);
  
    }
      if(peripheral.name != null && peripheral.name.substring(0,4) == "Avid" && !foundDevices.includes(peripheral.advertising.localName.substring(5)))
      {
        //console.log("Device Found "+peripheral.advertising.localName.substring(5));
        checkIfDeviceIsRegistered(peripheral.advertising.localName.substring(5)).then((response)=>{
  
          console.log("Device Status Is "+response);
          var char = "";
          if(response == "DEVICE_ALREADY_REGISTERED")
            char = "Device Already Registered";
          if(response == "DEVICE_DOES_NOT_EXIST")
            char = "Device Not Configured";
           
          setDeviceList(deviceList => [...deviceList,<Pressable style={{marginTop:'3%',marginBottom:'3%',alignSelf:'center',width:'80%',borderWidth:2,backgroundColor:'white',borderColor:avidPurpleHex}} deviceId={peripheral.advertising.localName.substring(5)} onPress={e=>onChanged(e,peripheral.advertising.localName.substring(5)+" "+char)} ><Text style={{padding:'4%',fontFamily: "Verdana-Bold",color: avidPurpleHex, textAlign: 'center', fontSize: 23}}>{peripheral.advertising.localName.substring(5)}</Text><Text style={{fontFamily: "Verdana-Bold",color: avidPurpleHex,textAlign:'center',fontSize:15}}>{char+"\n"}</Text></Pressable>])
          setFoundDevices(foundDevices =>[...foundDevices,peripheral.advertising.localName.substring(5)]);
  
        });
        
      }
  
    }

    bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
  bleManagerEmitter.removeAllListeners('BleManagerStopScan');
  bleManagerEmitter.addListener('BleManagerDiscoverPeripheral',handleSelectFoundDevice);
  bleManagerEmitter.addListener('BleManagerStopScan',(args)=>{
    
    if(!foundDevice)
      Alert.alert("Error","We could not detect any nearby devices. Please try again");
    
    setIsScanningA(false);});

    return(
      <View>
        <Modal animationType='none' visible={isRegistering} transparent={true}  >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
          <Text style={{textAlign:'center'}}>Submitting Your Information</Text>
          </View>
          <ActivityIndicator animating={true}/>
          </View>
          
        </Modal>
       
        
        <TouchableOpacity onPress={()=>{BleManager.scan([],scanTimeout,false);setIsScanningA(true)}} style={{alignSelf:'center',marginTop:'8%',width:'80%',borderWidth:2,backgroundColor:avidPurpleHex,borderColor:avidPurpleHex}}><Text style={{padding:'4%',alignSelf:'center', fontSize:20,fontWeight:'bold',color:'white'}}>Scan For Nearby Devices</Text></TouchableOpacity>
        <Text style={{textAlign:'center'}}>{registerStatus}</Text>
        
      
      <View>
        {deviceList}
        </View>
      </View>
        );
      
}



export default App;
