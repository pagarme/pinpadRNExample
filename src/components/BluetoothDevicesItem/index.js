import React from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  TouchableOpacity,
} from 'react-native';
import styles from './styles';

function BluetoothDevicesItem({
  name,
  address,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
    >
      <Text style={styles.nameText}>
        {name}
      </Text>
      <Text style={styles.addressText}>
        {address}
      </Text>
    </TouchableOpacity>
  );
}

BluetoothDevicesItem.propTypes = {
  name: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default BluetoothDevicesItem;
