
## Getting started

First, you need to clone the repo and install dependencies:

```sh
$ yarn add react-native-mpos-native
$ react-native link react-native-mpos-native
```

## Android setup

You must confirm that `./android/build.gradle` has the following configuration:
```gradle
allProjects {
  repositories {
	  // ...
	  maven {
	    url "https://dl.bintray.com/vivareal/maven"
	  }
	  flatDir {
	    dirs "$rootDir/../node_modules/react-native-mpos-native/android/libs"
	  }
  }
}
```
Then inside of `./android/app/build.gradle` add:
```gradle
dependencies {
  // ...
  implementation 'br.com.vivareal:cuid-android:0.1.0'
}
```

Then inside of `./android/app/src/main/AndroidManifest.xml` add:

`xmlns:tools="http://schemas.android.com/tools"` 
`tools:replace="android:allowBackup"`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools"
  package="com.package">

	<application 
	  ...
      android:allowBackup="false"
      tools:replace="android:allowBackup"
	>
	</application>
</manifest>
```

Then inside of `./android/app` create a folder `libs` if not exists. Copy files:
`mpos-android.native.jar` and `mpos-android.aar` from `/appFolder/node_modules/react-native-mpos-native/android/libs/`

Rebuild project

## iOS
1. Required iOS 10.3 or later.

2. Install Pods.
```sh
$ cd ios/
$ pod install
```
3. Open your iOS project workspace on XCode.

4. Add `MposSDK.framework` and `Result.framework` in `Frameworks, Libraries, and Embedded Content`. Use the node_modules reference `./node_modules/react-native-mpos-native/ios/libs` to drag to the project.

5. Add `"$(SRCROOT)/../node_modules/react-native-mpos-native/ios/libs"` in Build Settings > Framework Search Paths.

6. Set `Enable Bitcode` to `No`.

## Basic Usage

### Pinpad/Mpos
```javascript
mpos.addListeners({
  bluetoothConnected: () => {
    mpos.initialize();
  },

  bluetoothDisconnected: () => {
  },

  bluetoothErrored: (error) => {
  },
  receiveInitialization: () => {
    // Check for emv table updates.
    //
    // If you want to force a table update, without even
    // checking if it's necessary, simply change this flag to `true`.
    mpos.downloadEmvTablesToDevice(false);

    mpos.displayText('CHECKING UPDATES');
  },
  receiveNotification: (notification) => {
  },
  receiveTableUpdated: () => {
    const paymentMethod = mpos.PaymentMethod.CreditCard; // Another possibility is `DebitCard`.

    mpos.payAmount(amount, paymentMethod);
  },
  receiveCardHash: async (result) => {
    mpos.displayText('PROCESSING...');

    try {
      //Call your transaction API, above example calling Pagar.me API
      const transaction = await transactionService.createTransaction({
        amount,
        api_key: credentials.apiKey,
        card_hash: result.cardHash,
        local_time: new Date().toString(),
      });

      if (result.shouldFinishTransaction) {
        mpos.finishTransaction(
          true,
          parseInt(transaction.acquirer_response_code, 10),
          transaction.card_emv_response,
        );
      } else {
        // Remember to always call `mpos.close` once the transaction has finished.
        mpos.close('PAYMENT ACCEPTED');
      }
    } catch (error) {
      if (result.shouldFinishTransaction) {
        mpos.finishTransaction(false, 0, null);
      } else {
        mpos.close('PAYMENT REFUSED');
      }
    }
  },
  receiveFinishTransaction: () => {
    mpos.close('PAYMENT ACCEPTED');
  },
  receiveError: (error) => {
    const errorCode = Platform.OS === 'ios' ? error.code : error;
    mpos.close(`ERROR: ${errorCode}`);
  },
  receiveClose: () => {
    // Dispose resources and invalidate callbacks after finishing a transaction.
    mpos.dispose();
  },
  receiveOperationCancelled: () => null,
  receiveOperationCompleted: () => null,
});
```


## Functions

```javascript
// Create a new instance Mpos. Required pass the paired device selected
mpos.createMpos(selectedDevice, credentials.encryptionKey);

// Starts the payment workflow.
mpos.openConnection(true);

// Clear all listeners
mpos.dispose();

// Show Message on the pinpad/mpos
mpos.displayText('Message');

// Initialize payment flow
mpos.payAmount(amount, paymentMethod);

// Close payment flow
mpos.close('Message');

// Avaiable listeners
mpos.addListeners({
  // iOS will most probably start from `receiveInitialization` once `openConnection` is
  // called.
  //
  // The implementation of this listener is only required for Android.
  bluetoothConnected: () => {},

  bluetoothDisconnected: () => {},

  bluetoothErrored: (error) => {},

  // This function is called once the pinpad is connected and ready to start
  // receiving messages.
  receiveInitialization: () => {},

  // Called everytime the pinpad sends a notification back to the app.
  receiveNotification: (notification) => {},

  // Called as result of `downloadEmvTablesToDevice` once there's a confirmation
  // that the emv tables inside the pinpad are up to date or have been reloaded.
  receiveTableUpdated: () => {},

  // Called once a card hash has been generated. Here's where a transaction
  // must be created at pagar.me's API.
  receiveCardHash: (result) => {},

  // Called as result of `finishTransaction`.
  receiveFinishTransaction: () => {},

  receiveError: (error) => {},

  receiveClose: () => {},

  // Those are kind of optional listeners.
  receiveOperationCancelled: () => null,

  receiveOperationCompleted: () => null,
});
```
The simplest usage was 'quite' documented on example `./src/screens/DeviceDetails`.

### Bluetooth
The simplest usage was 'quite' documented on `./src/screens/BluetoothDevices`.


## Example

To run the example:

```sh
$ yarn
```

### Android
```sh
$ yarn run android
```

### iOS
```sh
$ cd ios/
$ pod install
$ cd ..
$ yarn run ios
```

