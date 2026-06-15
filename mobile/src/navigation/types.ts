// Tipi dei parametri di navigazione.
export type HomeStackParamList = {
  Map: undefined;
  Ride: { idNoleggio: string };
  Summary: { idNoleggio: string };
  ReportFault: { idMezzo: string; codiceMezzo: string };
  Route: undefined;
};

export type HistoryStackParamList = {
  History: undefined;
  Summary: { idNoleggio: string };
};

export type SupportStackParamList = {
  Support: undefined;
  Chat: { idRichiesta: string; titolo?: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Payment: undefined;
  EditProfile: undefined;
  Patente: undefined;
  Wallet: undefined;
  Promotions: undefined;
  Settings: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  SupportTab: undefined;
  ProfileTab: undefined;
};
