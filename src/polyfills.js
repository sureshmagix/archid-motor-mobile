import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Buffer } from 'buffer';
import process from 'process';
import { EventEmitter } from 'events';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = process;
}

if (typeof global.EventEmitter === 'undefined') {
  global.EventEmitter = EventEmitter;
}

if (typeof global.navigator === 'undefined') {
  global.navigator = {};
}

global.navigator.product = 'ReactNative';