import {useEffect, useState} from 'react';
import {Keyboard} from 'react-native';

// 키보드가 올라와 있는지. 탭바가 입력창을 가리지 않게 숨길 때 쓴다.
export const useKeyboardVisible = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
};
