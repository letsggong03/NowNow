import {useEffect, useState} from 'react';

import {getProfile} from '../../../services/api/profile';
import {profileDefaults} from '../constants/profileData';

export const useProfile = () => {
  const [name, setName] = useState(profileDefaults.name);

  useEffect(() => {
    let mounted = true;

    getProfile().then(nickname => {
      if (mounted && nickname) {
        setName(nickname);
      }
    }).catch(() => {
      // 연결 오류에도 기본 프로필로 화면을 유지한다.
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {name, message: profileDefaults.message};
};
