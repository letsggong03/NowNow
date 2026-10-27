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
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {name, message: profileDefaults.message};
};
