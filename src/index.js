import { createStackNavigator } from 'react-navigation-stack';
import BluetoothDevices from './screens/BluetoothDevices';
import DeviceDetails from './screens/DeviceDetails';

const RootStack = createStackNavigator(
  {
    BluetoothDevices,
    DeviceDetails,
  },
  {
    initialRouteName: 'BluetoothDevices',
  },
);

export default RootStack;
