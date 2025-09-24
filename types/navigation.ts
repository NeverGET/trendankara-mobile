import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

export type TabParamList = {
  index: undefined;
  polls: undefined;
  news: undefined;
  sponsors: undefined;
  settings: undefined;
};

export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: BottomTabNavigationProp<TabParamList, T>;
  route: RouteProp<TabParamList, T>;
};