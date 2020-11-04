import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  useFocusEffect,
  useNavigationParam,
} from 'react-navigation-hooks';
import {
  Alert,
  Platform,
} from 'react-native';
import { mpos } from 'react-native-mpos-native';
import transactionService from '../../services/transaction';
import DeviceDetailsContainer from '../../containers/DeviceDetails';
import { ctlsError } from './ctlsError';


// DO NOT KEEP YOUR SECRETS IN PLAIN TEXT.
//
// Please, note this was meant to be a simple example not a real world application, and
// the following object just helps keeping secrets together.
//
// This is NOT a pattern to be followed, NEVER DO THIS.
//
// In a real world app, consider using keychains or compile-time obfuscators (eg.: cocoapods-keys)
// to store secrets.
const credentials = {
  apiKey: '',
  encryptionKey: '',
};
let payAmountCounter = 0;

function DeviceDetails() {
  const [amount, setAmount] = useState(0);
  const [amountInput, setAmountInput] = useState('');
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionError, setTransactionError] = useState(null);

  useEffect(() => {
    if (amountInput && amountInput.length > 0) {
      // TODO: Use an internationalization library instead of a simple `replace` call.
      const parsedAmountInput = parseFloat(amountInput.replace(/,+/g, '.'));
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(parsedAmountInput)) {
        setAmount(parsedAmountInput);
      }
    } else {
      setAmount(0);
    }
  }, [amountInput]);

  const selectedDevice = useNavigationParam('selectedDevice');
  useFocusEffect(useCallback(() => {
    // Before using the mpos object, it must be initialized using your pagar.me's encryption key.
    mpos.createMpos(selectedDevice, credentials.encryptionKey);

    return () => mpos.dispose();
  }, []));

  const onTransactionSuccess = (transaction, shouldFinishTransaction) => {
    // In case the flag maps to `true`, you must call `finishTransaction` on pinpad.
    if (shouldFinishTransaction) {
      mpos.finishTransaction(
        true,
        parseInt(transaction.acquirer_response_code, 10),
        transaction.card_emv_response,
      );
    } else {
      // Remember to always call `mpos.close` once the transaction has finished.
      mpos.close('PAYMENT ACCEPTED');
      Alert.alert('Success.', 'Payment accepted.');
    }

    setTransactionStatus(null);
  };

  const onTransactionError = (shouldFinishTransaction) => {
    if (shouldFinishTransaction) {
      mpos.finishTransaction(false, 0, null);
    } else {
      mpos.close('PAYMENT REFUSED');
      Alert.alert('Failure.', 'Payment refused.');
    }

    setTransactionStatus(null);
  };

  const onSubmitAmount = () => {
    mpos.addListeners({
      // iOS will most probably start from `receiveInitialization` once `openConnection` is
      // called.
      //
      // The implementation of this listener is only required for Android.
      bluetoothConnected: () => {
        setTransactionStatus('Bluetooth connected, initializing pinpad...');
        mpos.initialize();
      },
      bluetoothDisconnected: () => {
        setTransactionStatus('Lost bluetooth connection...');
      },
      bluetoothErrored: (error) => {
        setTransactionStatus(`An error occurred: ${error}`);
      },
      // This function is called once the pinpad is connected and ready to start
      // receiving messages.
      receiveInitialization: () => {
        // Check for emv table updates.
        //
        // If you want to force a table update, without even
        // checking if it's necessary, simply change this flag to `true`.
        mpos.downloadEmvTablesToDevice(false);

        setTransactionStatus('Checking for emv table updates...');
        mpos.displayText('CHECKING UPDATES');
      },
      // Called everytime the pinpad sends a notification back to the app.
      receiveNotification: (notification) => {
        console.log(`[${selectedDevice.name}] Sent notification: `, notification);
      },
      // Called as result of `downloadEmvTablesToDevice` once there's a confirmation
      // that the emv tables inside the pinpad are up to date or have been reloaded.
      receiveTableUpdated: () => {
        setTransactionStatus('Emv tables are up to date. Insert credit card...');

        const method = mpos.PaymentMethod.CreditCard; // Another possibility is `DebitCard`.
        mpos.payAmount(amount, method);
      },
      // Called once a card hash has been generated. Here's where a transaction
      // must be created at pagar.me's API.
      receiveCardHash: async (result) => {
        mpos.displayText('PROCESSING...');
        setTransactionStatus('Received card hash. Creating transaction...');

        try {
          const transaction = await transactionService.createTransaction({
            amount,
            api_key: credentials.apiKey,
            card_hash: result.cardHash,
            local_time: new Date().toString(),
          });

          onTransactionSuccess(transaction, result.shouldFinishTransaction);
        } catch (error) {
          setTransactionError(error);
          onTransactionError(result.shouldFinishTransaction);
        }
      },
      // Called as result of `finishTransaction`.
      receiveFinishTransaction: () => {
        if (transactionError) {
          // This will just present an alert and close the pinpad.
          onTransactionError(false);
        } else {
          onTransactionSuccess(null, false);
        }
      },
      receiveError: (error) => {
        //If received one of this contactless error, you should call mpos.payAmount again disabling contactless
        if (error == ctlsError.ST_CTLSSINVALIDAT || 
            error == ctlsError.ST_CTLSSPROBLEMS || 
            error == ctlsError.ST_CTLSSAPPNAV || 
            error == ctlsError.ST_CTLSSAPPNAUT) {
          const disabledCtls = true;
          const method = mpos.PaymentMethod.CreditCard;
          mpos.payAmount(amount, method, disabledCtls);
        } else if (error == ctlsError.ST_CTLSSMULTIPLE) { //If the error is ST_CTLSSMULTIPLE you just need call mpos.payAmount again
          const method = mpos.PaymentMethod.CreditCard;
          mpos.payAmount(amount, method);
        } else if (error == ctlsError.ST_CTLSSCOMMERR) { //If received the error ST_CTLSSCOMMERR twice contactless should be disabled 
          payAmountCounter++;
          if (payAmountCounter < 2) {
            const disabledCtls = false;
            const method = mpos.PaymentMethod.CreditCard;
            mpos.payAmount(amount, method, disabledCtls);
          } else {
            payAmountCounter = 0;
            const disabledCtls = true;
            const method = mpos.PaymentMethod.CreditCard;
            mpos.payAmount(amount, method, disabledCtls);
          }
        } else {
          setTransactionStatus(null);
          Alert.alert('Error', `An error occurred:\n${JSON.stringify(error)}`);
          const errorCode = Platform.OS === 'ios' ? error.code : error;
          mpos.close(`ERROR: ${errorCode}`);
        }

        
      },
      receiveClose: () => {
        // Dispose resources and invalidate callbacks after finishing a transaction.
        mpos.dispose();
      },
      // Those are kind of optional listeners.
      receiveOperationCancelled: () => null,
      receiveOperationCompleted: () => null,
    });
    // Starts the payment workflow.
    mpos.openConnection(true);
  };

  return (
    <DeviceDetailsContainer
      amountInput={amountInput}
      onSubmitAmount={onSubmitAmount}
      transactionStatus={transactionStatus}
      onChangeAmountInputText={setAmountInput}
    />
  );
}

DeviceDetails.navigationOptions = ({ navigation }) => {
  const selectedDevice = navigation.getParam('selectedDevice');
  return {
    title: selectedDevice.name,
  };
};

export default DeviceDetails;
