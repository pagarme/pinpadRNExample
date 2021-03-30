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
    marginBottom: 20,
    marginHorizontal: 40,
  },
  buttonTitle: {
    color: '#147efb',
    fontSize: 17,
  },
  pickerSelect: {
    color: 'gray',
    alignSelf: 'stretch',
    fontSize: 17,
    marginLeft: 130,
    marginBottom: 10,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginHorizontal: 40,
  },
  transactionStatusText: {
    color: 'gray',
    textAlign: 'center',
    marginRight: 12,
  },
});
