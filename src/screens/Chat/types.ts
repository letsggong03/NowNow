export type MessageRole = 'user' | 'bot';

export type ChatAction =
  | 'summarize_yes'
  | 'summarize_no'
  | 'summary_add_keywords'
  | 'solution_yes'
  | 'solution_no'
  | 'home'
  | 'meditation'
  | 'pet_cat'
  | 'music_calm'
  | 'food_delivery'
  | 'food_more'
  | 'food_seasonal'
  | 'food_trending'
  | 'open_link'
  | 'open_delivery';

export type ReliefAction = Extract<ChatAction, 'home' | 'meditation'>;

export interface MessageButton {
  label: string;
  action: ChatAction;
  target?: string;
}

export interface Message {
  role: MessageRole;
  content: string;
  createdAt: string;
  buttons?: MessageButton[];
}

export type ChatStage =
  | 'initial'
  | 'listening'
  | 'summary_confirm'
  | 'summary_shown'
  | 'solution_confirm'
  | 'solution_shown';
