
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
The simplest usage was 'quite' documented on `./src/screens/DeviceDetails`.

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
