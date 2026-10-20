export type MessageRole = 'user' | 'bot';

export type ChatAction =
  | 'summarize_yes'
  | 'summarize_no'
  | 'solution_yes'
  | 'solution_no'
  | 'home'
  | 'meditation'
  | 'community';

export type ReliefAction = Extract<ChatAction, 'home' | 'meditation' | 'community'>;

export interface MessageButton {
  label: string;
  action: ChatAction;
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
