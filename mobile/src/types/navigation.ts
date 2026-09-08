export type WebModuleParams = {
  title: string;
  path: string;
};

export type RootStackParamList = {
  Home: undefined;
  WebModule: WebModuleParams;
};
