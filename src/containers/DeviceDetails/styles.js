import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentForm: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  amountInput: {
    height: 40,
    alignSelf: 'stretch',
    borderColor: 'gray',
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    borderRadius: 8,
    marginBottom: 40,
    marginHorizontal: 40,
  },
  buttonTitle: {
    color: '#147efb',
    fontSize: 17,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: 40,
  },
  transactionStatusText: {
    color: 'gray',
    textAlign: 'center',
    marginRight: 12,
  },
});
