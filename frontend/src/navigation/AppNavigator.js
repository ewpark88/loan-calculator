import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import LoanCalculatorScreen from '../screens/LoanCalculatorScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RepaymentGuideScreen from '../screens/RepaymentGuideScreen';
import BrokerageScreen from '../screens/BrokerageScreen';
import AcquisitionTaxScreen from '../screens/AcquisitionTaxScreen';

const Stack = createStackNavigator();

const headerStyle = {
  headerStyle: {
    backgroundColor: '#1B998B',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={headerStyle}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoanCalculator"
          component={LoanCalculatorScreen}
          options={{ title: '대출 계산' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: '계산 결과' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: '계산 기록' }}
        />
        <Stack.Screen
          name="RepaymentGuide"
          component={RepaymentGuideScreen}
          options={{ title: '상환방식 안내' }}
        />
        <Stack.Screen
          name="Brokerage"
          component={BrokerageScreen}
          options={{ title: '중개보수 계산기' }}
        />
        <Stack.Screen
          name="AcquisitionTax"
          component={AcquisitionTaxScreen}
          options={{ title: '취득세 계산기' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
