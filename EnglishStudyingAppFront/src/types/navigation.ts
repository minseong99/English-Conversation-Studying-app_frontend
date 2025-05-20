export type RootStackParamList = {
  MainMenu: undefined;
  SpeakerSelection: undefined;
  ChatText: undefined;
  WordChain: undefined;
  ChatVoice: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Home: undefined;
  Voice: undefined;
  Chat: undefined;
  Games: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
