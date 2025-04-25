
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Mychat } from "@Mychat/chat-sdk-react-native";
import { AppConstants } from './AppConstants';
import { MychatContextProvider, MychatLocalize } from '@Mychat/chat-uikit-react-native';
import { MychatTheme } from '@Mychat/chat-uikit-react-native';
import { MychatUIKit } from '@Mychat/chat-uikit-react-native';
import StackNavigator from './src/StackNavigator';
import { UserContextProvider } from './UserContext';
import { MychatIncomingCall } from '@Mychat/chat-uikit-react-native';
import { MychatUIEventHandler } from '@Mychat/chat-uikit-react-native';
import { metaInfo } from './src/metaInfo';
var listnerID = "UNIQUE_LISTENER_ID";

const App = () => {

  const getPermissions = () => {
    if (Platform.OS == "android") {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
    }
  }

  const [callReceived, setCallReceived] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const incomingCall = useRef(null);

  useEffect(() => {
    getPermissions();
    MychatUIKit.init({
      appId: AppConstants.APP_ID,
      authKey: AppConstants.AUTH_KEY,
      region: AppConstants.REGION,
    })
      .then(() => {
        MychatLocalize.setLocale("en");
        try{Mychat.setDemoMetaInfo(metaInfo)}catch(err){}
        if (Mychat.setSource) {
          Mychat.setSource('ui-kit', Platform.OS, 'react-native');
        }
        setIsInitialized(true);
      })
      .catch(() => {
        return null;
      });

    Mychat.addCallListener(
      listnerID,
      new Mychat.CallListener({
        onIncomingCallReceived: (call) => {
          incomingCall.current = call;
          setCallReceived(true);
        },
        onOutgoingCallRejected: (call) => {
          incomingCall.current = null;
          setCallReceived(false);
        },
        onIncomingCallCancelled: (call) => {
          incomingCall.current = null;
          setCallReceived(false);
        }
      })
    );

    MychatUIEventHandler.addCallListener(listnerID, {
      ccCallEnded: () => {
        incomingCall.current = null;
        setCallReceived(false);
      },
    });

    return () => {
      MychatUIEventHandler.removeCallListener(listnerID);
      Mychat.removeCallListener(listnerID)
    }

  }, []);

  return (
    <View style={styles.container}>
      {isInitialized ? (
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar backgroundColor={"white"} barStyle={"dark-content"} />
          {callReceived && (
            <MychatIncomingCall
              call={incomingCall.current}
              onDecline={(call) => {
                setCallReceived(false);
              }}
              onError={(error) => {
                setCallReceived(false);
              }}
              incomingCallStyle={{
                backgroundColor: "white",
                titleColor: "black",
                subtitleColor: "gray",
                titleFont: {
                  fontSize: 20,
                  fontWeight: "bold",
                },
              }}
            />
          )}
          <UserContextProvider>
            <MychatContextProvider theme={new MychatTheme({})}>
              <StackNavigator />
            </MychatContextProvider>
          </UserContextProvider>
        </SafeAreaView>
      ) : (
        <View style={[styles.container, {justifyContent: "center"}]}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
})

export default App;
