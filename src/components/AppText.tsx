import React from 'react';
import {Platform, Text, type TextProps} from 'react-native';

// 앱 글꼴. 안드로이드 res/font/pretendard.xml에 등록돼 있고 fontWeight로 굵기를 고른다.
export const FONT_FAMILY = Platform.OS === 'android' ? 'Pretendard' : undefined;

const fontStyle = {fontFamily: FONT_FAMILY};

// 앱 전체 글자는 이 컴포넌트를 쓴다(기본 Text에 글꼴을 지정할 방법이 없다).
export default function AppText({style, ...props}: TextProps) {
  return <Text {...props} style={[fontStyle, style]} />;
}
