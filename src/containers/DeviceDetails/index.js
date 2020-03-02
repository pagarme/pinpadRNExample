import React from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  View,
  Platform,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import styles from './styles';

function DeviceDetails({
  amountInput,
  onSubmitAmount,
  transactionStatus,
  onChangeAmountInputText,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        enabled
        style={[styles.container, styles.paymentForm]}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <View style={styles.transactionStatus}>
          <Text style={styles.transactionStatusText}>
            {transactionStatus}
          </Text>
          {
            transactionStatus !== null && <ActivityIndicator size="small" color="gray" />
          }
        </View>
        <TextInput
          style={styles.amountInput}
          value={amountInput}
          editable={transactionStatus === null}
          onChangeText={onChangeAmountInputText}
          keyboardType="numeric"
          placeholder="Amount in cents"
        />
        <TouchableOpacity
          onPress={onSubmitAmount}
          disabled={transactionStatus !== null}
        >
          <Text style={styles.buttonTitle}>
            Pay amount
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

DeviceDetails.defaultProps = {
  transactionStatus: null,
};

DeviceDetails.propTypes = {
  amountInput: PropTypes.string.isRequired,
  onSubmitAmount: PropTypes.func.isRequired,
  transactionStatus: PropTypes.string,
  onChangeAmountInputText: PropTypes.func.isRequired,
};

export default DeviceDetails;
