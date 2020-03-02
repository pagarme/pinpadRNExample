import 'react-native-gesture-handler';
import React from 'react';
import {AppRegistry} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {name as appName} from './app.json';
import RootStack from './src';

const App = createAppContainer(RootStack);
AppRegistry.registerComponent(appName, () => App);
