import {
  Bell,
  Database,
  HelpCircle,
  LockKeyhole,
  LogOut,
  Moon,
  ShieldCheck,
  UserCog,
} from 'lucide-react-native';

import {CHARACTER_NAME} from '../../../constants/app';
import {withJosa} from '../../../utils/josa';

export const profileDefaults = {
  name: '사용자',
  message: `${withJosa(CHARACTER_NAME, '과/와')} 함께 마음을 돌보는 중`,
};

export const accountMenus = [
  {label: '계정 설정', description: '프로필, 이메일, 비밀번호', Icon: UserCog},
  {label: '개인정보 보호', description: '데이터 접근과 보안 관리', Icon: LockKeyhole},
];

export const notificationMenu = {
  label: '알림 설정',
  description: '일기 알림과 루틴 알림',
  Icon: Bell,
};

export const appMenus = [
  {label: '데이터 백업', description: '기록을 안전하게 보관하기', Icon: Database},
  {label: '도움말', description: '사용법과 문의하기', Icon: HelpCircle},
];

export const wellnessMenus = [
  {label: '스트레스 기준 관리', description: '나에게 맞는 감지 기준 설정', Icon: ShieldCheck},
];

export const themeMenu = {
  Icon: Moon,
};

export const logoutMenu = {
  label: '로그아웃',
  Icon: LogOut,
};
