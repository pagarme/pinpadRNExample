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
import sleep from './helper';

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
  encryptionKey: ''
};
const abecsErrors = mpos.AbecsErrors

function DeviceDetails() {
  const [amount, setAmount] = useState(0);
  const [amountInput, setAmountInput] = useState('');
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [localTransactionId, setLocalTransactionId] = useState(0);

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

  const refundTransaction = async() => {
    try {
      const refund = await transactionService.refundTransaction({
        api_key: credentials.apiKey,
      }, localTransactionId);
      Alert.alert('Warning.', 'Payment refunded.');
      console.log(refund);
    } catch (error) {
      console.log(error);
    }
  }

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
          setLocalTransactionId(transaction.local_transaction_id);
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
      receiveError: async (error) => {
        //If received one of this contactless error, you should call mpos.payAmount again disabling contactless
        // const modelName = await mpos.getModelName()
        
        switch(error) {
          case abecsErrors.ST_CTLSCOMMERR:
          case abecsErrors.ST_CTLSIFCHG:
            mpos.payAmount(amount, mpos.PaymentMethod.CreditCard, true);
            break;
          case abecsErrors.ST_TABVERDIF:
            mpos.displayText('UPDATE TABLE IS NECESSARY');
            await sleep(2000);
            mpos.downloadEmvTablesToDevice(true);
            break;
          case abecsErrors.ST_CTLSMULTIPLE:
            mpos.displayText('PRESENT ONE CARD ONLY');
            await sleep(2000);
            mpos.payAmount(amount, mpos.PaymentMethod.CreditCard);
            break;
          case abecsErrors.ST_CTLSINVALIDAT:
            mpos.close('BLOCKED CARD');
            break;
          case abecsErrors.ST_CTLSEXTCVM:
            mpos.payAmount(amount, mpos.PaymentMethod.CreditCard);
            break;
          case abecsErrors.ST_CTLSPROBLEMS:
            mpos.close('CARD NOT SUPPORTED');
            break;
          case abecsErrors.ST_CTLSAPPNAV:
            mpos.close('NO APPLICATION');
            break;
          case abecsErrors.ST_CARDINVALIDAT:
            mpos.close('INVALID CARD');
            break;
          case abecsErrors.ST_DUMBCARD:
          case abecsErrors.ST_ERRCARD:
          case abecsErrors.ST_CARDAPPNAUT:
            const modelName = await mpos.getModelName();
            if (modelName === 'D180') {
              mpos.displayText('CHIP ERROR. USE MAGSTRIPE');
              await sleep(2000);
              mpos.payAmount(amount, mpos.PaymentMethod.CreditCard);
            } else {
              mpos.close('CHIP CANNOT BE READ');
            }
            break;
          case -3:
            mpos.close('TRANSACTION DENIED GOC');
            break;
          case -4:
            await refundTransaction();
            mpos.close('TRANSACTION DENIED FNC');
            break;
          case -5:
            mpos.displayText('USE CHIP');
            mpos.payAmount(amount, mpos.PaymentMethod.CreditCard);
            break;
          case 1006:
            mpos.close('Allowable PIN tries exceeded');
            break;
          case 1017:
            mpos.close('INCORRECT PIN');
            break;
          case 1023:
            mpos.payAmount(amount, mpos.PaymentMethod.CreditCard, true);
            break;
          case 9111:
            mpos.close('TRANSACTION TIME OUT');
            await refundTransaction();
            break;
          default:
            setTransactionStatus(null);
            Alert.alert('Error', `An error occurred:\n${JSON.stringify(error)}`);
            const errorCode = Platform.OS === 'ios' ? error.code : error;
            mpos.close(`ERROR: ${errorCode}`);
            break;
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
