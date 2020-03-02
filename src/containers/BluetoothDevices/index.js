import React from 'react';
import PropTypes from 'prop-types';
import {
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { BluetoothDevicesItem } from '../../components';
import styles from './styles';

function BluetoothDevices({
  devices,
  loading,
  onSelectDevice,
}) {
  const keyExtractor = ({ address }) => address;
  const ItemSeparatorComponent = () => <View style={styles.separator} />;

  const renderItem = ({
    item: device, // eslint-disable-line react/prop-types
  }) => (
    <BluetoothDevicesItem
      name={device.name}
      address={device.address}
      onPress={() => onSelectDevice(device)}
    />
  );

  const devicesList = (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparatorComponent}
      />
    </SafeAreaView>
  );

  const activityIndicator = (
    <SafeAreaView style={styles.centeredView}>
      <ActivityIndicator size="large" color="gray" />
    </SafeAreaView>
  );

  return loading ? activityIndicator : devicesList;
}

BluetoothDevices.propTypes = {
  loading: PropTypes.bool.isRequired,
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      address: PropTypes.string,
    }),
  ).isRequired,
  onSelectDevice: PropTypes.func.isRequired,
};

export default BluetoothDevices;
