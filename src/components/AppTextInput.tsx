import React from 'react';
import {TextInput, type TextInputProps} from 'react-native';

import {FONT_FAMILY} from './AppText';

const fontStyle = {fontFamily: FONT_FAMILY};

// 앱 글꼴을 쓰는 입력창. 기본 TextInput 대신 쓴다.
export default function AppTextInput({style, ...props}: TextInputProps) {
  return <TextInput {...props} style={[fontStyle, style]} />;
}
