import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MotorPumpIcon = ({ size = 64, color = COLORS.off, status = 'OFF', styleName = 'DEFAULT' }) => {
  const flowAnim = useRef(new Animated.Value(0)).current;

  const isRunning =
    status === 'ON' ||
    status === 'RUN' ||
    status === 'ACTIVE' ||
    status === 'RUNNING' ||
    String(status).toUpperCase().includes('ON') ||
    String(status).toUpperCase().includes('RUN');

  useEffect(() => {
    if (!isRunning) {
      flowAnim.setValue(0);
      return;
    }

    // 800ms for active fast flow when ON
    flowAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 20, // matches the strokeDasharray spacing
        duration: 800,
        useNativeDriver: false, // SVG animations must not use native driver
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [isRunning, flowAnim]);

  const flowColor = '#06b6d4'; // Cyan active flow
  const pipeBgColor = '#cbd5e1';

  // 1. DEFAULT: The original pump shape with a bottom horizontal flow pipe
  const renderDefault = () => (
    <G>
      <Path
        fill={color}
        d="M46 69V27c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4zM31 45h3v6h-3zM40 63V33c-2.2 0-4 1.8-4 4v22c0 2.2 1.8 4 4 4zM57 69h18v4H57zM76 67h8V29H48v38h28zM55 33h22c1.7 0 3 1.3 3 3s-1.3 3-3 3H55c-1.7 0-3-1.3-3-3s1.3-3 3-3zm0 12h22c1.7 0 3 1.3 3 3s-1.3 3-3 3H55c-1.7 0-3-1.3-3-3s1.3-3 3-3zm-3 15c0-1.7 1.3-3 3-3h22c1.7 0 3 1.3 3 3s-1.3 3-3 3H55c-1.7 0-3-1.3-3-3zm-23 1V35H15.4L13 37.4v21.2l2.4 2.4H29zm-8.7-20.7c.4-.4 1-.4 1.4 0 .2.2 5.3 5.3 5.3 9.7 0 3.3-2.7 6-6 6s-6-2.7-6-6c0-4.4 5.1-9.5 5.3-9.7zM90 27h-4v42h4c2.2 0 4-1.8 4-4V31c0-2.2-1.8-4-4-4zM18 25h9.6l1.4-1.4V19H15v4.6l1.4 1.4zM19 27h6v6h-6zM6 45h5v6H6zM76 75H16.7l-2.3 6h71.2l-2.3-6z"
      />
      <Path
        d="M 12 88 H 88"
        stroke={pipeBgColor}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        opacity={0.3}
      />
      {isRunning && (
        <AnimatedPath
          d="M 12 88 H 88"
          stroke={flowColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
    </G>
  );

  // 2. A: Proper Centrifugal (Volute) Pump
  const renderA = () => (
    <G>
      <Rect x={6} y={36} width={6} height={28} rx={2} fill={color} opacity={0.7} />
      <Rect x={12} y={32} width={36} height={36} rx={4} fill={color} />
      <Path d="M 20 36 V 64 M 28 36 V 64 M 36 36 V 64 M 44 36 V 64" stroke="#ffffff" strokeWidth={2} opacity={0.3} />
      
      <Rect x={48} y={44} width={10} height={12} fill={color} opacity={0.9} />
      
      <Circle cx={72} cy={50} r={20} fill={color} />
      <Circle cx={72} cy={50} r={14} fill="#ffffff" opacity={0.2} />
      <Circle cx={72} cy={50} r={6} fill={color} />

      <Rect x={64} y={84} width={16} height={4} fill={color} />
      <Rect x={64} y={12} width={16} height={4} fill={color} />

      <Path
        d="M 72 90 V 50 H 72 V 10"
        stroke={pipeBgColor}
        strokeWidth={6}
        fill="none"
        opacity={0.3}
      />
      {isRunning && (
        <AnimatedPath
          d="M 72 90 V 50"
          stroke={flowColor}
          strokeWidth={3}
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
      {isRunning && (
        <AnimatedPath
          d="M 72 50 V 10"
          stroke={flowColor}
          strokeWidth={3}
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
    </G>
  );

  // 3. B: Proper Submersible Borehole Pump
  const renderB = () => (
    <G>
      <Rect x={38} y={50} width={24} height={38} rx={2} fill={color} />
      <Path d="M 44 54 V 84 M 50 54 V 84 M 56 54 V 84" stroke="#ffffff" strokeWidth={1.5} opacity={0.3} />

      <Rect x={40} y={36} width={20} height={14} fill={color} opacity={0.6} rx={1} />
      <Path d="M 43 36 V 50 M 47 36 V 50 M 51 36 V 50 M 55 36 V 50 M 57 36 V 50" stroke="#ffffff" strokeWidth={1} opacity={0.4} />

      <Rect x={38} y={16} width={24} height={20} rx={2} fill={color} />
      <Path d="M 38 23 H 62 M 38 29 H 62" stroke="#ffffff" strokeWidth={1.5} opacity={0.3} />

      <Rect x={43} y={6} width={14} height={4} fill={color} rx={1} />

      <Path
        d="M 50 43 V 6"
        stroke={pipeBgColor}
        strokeWidth={6}
        fill="none"
        opacity={0.3}
      />
      {isRunning && (
        <AnimatedPath
          d="M 50 43 V 6"
          stroke={flowColor}
          strokeWidth={3}
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
    </G>
  );

  // 4. C: Proper Vertical Inline Pump
  const renderC = () => (
    <G>
      <Path d="M 10 74 H 36 M 64 74 H 90" stroke={color} strokeWidth={8} strokeLinecap="square" />
      <Rect x={10} y={68} width={4} height={12} fill={color} rx={1} />
      <Rect x={86} y={68} width={4} height={12} fill={color} rx={1} />

      <Circle cx={50} cy={66} r={16} fill={color} />
      <Circle cx={50} cy={66} r={10} fill="#ffffff" opacity={0.2} />

      <Rect x={45} y={44} width={10} height={10} fill={color} opacity={0.8} />

      <Rect x={35} y={12} width={30} height={32} rx={3} fill={color} />
      <Path d="M 39 18 H 61 M 39 24 H 61 M 39 30 H 61" stroke="#ffffff" strokeWidth={1.5} opacity={0.3} />
      <Path d="M 40 12 C 40 8, 60 8, 60 12 Z" fill={color} opacity={0.9} />

      <Path
        d="M 10 74 H 90"
        stroke={pipeBgColor}
        strokeWidth={6}
        fill="none"
        opacity={0.3}
      />
      {isRunning && (
        <AnimatedPath
          d="M 10 74 H 90"
          stroke={flowColor}
          strokeWidth={3}
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
    </G>
  );

  // 5. D: Proper Industrial Double-Diaphragm Pump
  const renderD = () => (
    <G>
      <Rect x={42} y={34} width={16} height={32} rx={2} fill={color} opacity={0.7} />
      <Path d="M 45 44 H 55 M 45 50 H 55 M 45 56 H 55" stroke="#ffffff" strokeWidth={1.5} opacity={0.3} />

      <Rect x={22} y={24} width={16} height={52} rx={6} fill={color} />
      <Rect x={62} y={24} width={16} height={52} rx={6} fill={color} />
      <Circle cx={30} cy={50} r={4} fill="#ffffff" opacity={0.2} />
      <Circle cx={70} cy={50} r={4} fill="#ffffff" opacity={0.2} />

      <Path d="M 30 24 H 70" stroke={color} strokeWidth={8} />
      <Path d="M 50 24 V 10" stroke={color} strokeWidth={8} />
      <Rect x={44} y={10} width={12} height={3} fill={color} rx={1} />
      
      <Path d="M 30 76 H 70" stroke={color} strokeWidth={8} />
      <Path d="M 50 76 V 90" stroke={color} strokeWidth={8} />
      <Rect x={44} y={87} width={12} height={3} fill={color} rx={1} />

      <Path
        d="M 50 90 V 10"
        stroke={pipeBgColor}
        strokeWidth={6}
        fill="none"
        opacity={0.3}
      />
      {isRunning && (
        <AnimatedPath
          d="M 50 90 V 10"
          stroke={flowColor}
          strokeWidth={3}
          strokeDasharray="10,10"
          strokeDashoffset={flowAnim}
          fill="none"
        />
      )}
    </G>
  );

  const renderIcon = () => {
    switch (String(styleName).toUpperCase()) {
      case 'A':
        return renderA();
      case 'B':
        return renderB();
      case 'C':
        return renderC();
      case 'D':
        return renderD();
      case 'DEFAULT':
      default:
        return renderDefault();
    }
  };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderIcon()}
      </Svg>
    </View>
  );
};

export default MotorPumpIcon;
