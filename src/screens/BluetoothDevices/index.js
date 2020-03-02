import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  useNavigation,
  useFocusEffect,
} from 'react-navigation-hooks';
import {
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { bluetooth } from 'react-native-mpos-native';

console.log(bluetooth);
import requestBluetoothPermission from '../../utils/request-bluetooth-permission';
import BluetoothDevicesContainer from '../../containers/BluetoothDevices';

const { BLUETOOTH_STATES } = bluetooth;

function BluetoothDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const selectedDeviceRef = useRef(selectedDevice);

  const { navigate } = useNavigation();

  // Await for react to compute the new state value, before trying
  // to connect the selected device.
  useEffect(() => {
    if (selectedDevice) {
      selectedDeviceRef.current = selectedDevice;

      setLoading(true);
      bluetooth.pairWith(selectedDevice);
    }
  }, [selectedDevice]);

  const handleOnReceiveNewDevice = ({
    name,
    address,
  }) => {
    const deviceItem = {
      name,
      address,
      // iOS needs this flag to know whether it will treat this device as a low-energy one
      // or an EAAccessory. But, for historical reasons, it's called `pax_d150` because it
      // was the first pinpad we've ever supported.
      //
      // Also, the two possible values are: `pax_d150` (low-energy) and `gertec_mp5` (EAAccessory).
      //
      // But again, despite the name, this flag ONLY serves for iOS to differ low-energy devices
      // from EAAccessory ones. Android will just ignore it.
      config: 'pax_d150',
    };

    setDevices((prevDevices) => {
      const isDeviceAdded = prevDevices.find((device) => device.address === deviceItem.address);
      if (!isDeviceAdded) {
        return [...prevDevices, deviceItem];
      }
      return prevDevices;
    });
  };

  const handleOnPairResult = ({ result }) => {
    // Again, for historical reasons, there's an `android` property on BLUETOOTH_STATES
    // which will serve for BOTH iOS and Android, cause' BOTH of them returns the EXACT same
    // values to represent connection results. So it's completely safe (at least by now) to
    // use those constants for both platforms.
    //
    // Also, the possible values are:
    //   NONE    = something went wrong;
    //   BONDED  = connected;
    //   BONDING = connecting;
    if (result === BLUETOOTH_STATES.android.BONDED) {
      setLoading(false);
      navigate('DeviceDetails', {
        selectedDevice: selectedDeviceRef.current,
      });
    }
  };

  // iOS will timeout the connection attempt after 3 seconds of no active response
  // from the selected device.
  //
  // By the way, the timeout period (3 seconds) is constant and non-configurable right now.
  const handleOnPairTimeout = () => {
    if (selectedDeviceRef.current) {
      Alert.alert(
        'Connection timed out',
        `Check if ${selectedDeviceRef.current.name} is nearby and active, then try again.`,
      );
    }
  };

  const startBluetoothScan = () => {
    // Initializes the bluetooth module.
    bluetooth.setUp(
      handleOnReceiveNewDevice,
      handleOnPairResult,
      handleOnPairTimeout,
    );

    // Start scanning for low-energy devices.
    bluetooth.startScan();
  };

  useFocusEffect(useCallback(() => {
    // Always remember to request permissions for ACCESS_COARSE_LOCATION on android.
    if (Platform.OS === 'android') {
      requestBluetoothPermission().then((result) => {
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          startBluetoothScan();
        }
      });
    } else {
      // iOS permission request will be handled by the system itself.
      startBluetoothScan();
    }

    // Note that `stopScan` will also dispose all cached information
    // about the discovered devices on the native side. So remember
    // to cleanup your app data as well.
    return () => {
      setDevices([]);
      bluetooth.stopScan();
    };
  }, []));

  return (
    <BluetoothDevicesContainer
      devices={devices}
      loading={loading}
      onSelectDevice={setSelectedDevice}
    />
  );
}

BluetoothDevices.navigationOptions = {
  title: 'Select a device',
};

export default BluetoothDevices;
