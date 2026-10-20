import type {ViewStyle} from 'react-native';

const SHADOW_COLOR = '#000000';

export const shadows = {
  subtle: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  raised: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;
