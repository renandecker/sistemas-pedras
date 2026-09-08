import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import NovoOrcamentoScreen from '../screens/NovoOrcamentoScreen';
import OrdensServicoScreen from '../screens/OrdensServicoScreen';
import MateriaisScreen from '../screens/MateriaisScreen';
import ClientesScreen from '../screens/ClientesScreen';

const Stack = createNativeStackNavigator();

const telaOptions = {
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
  headerBackTitleVisible: false,
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={telaOptions}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Marmoraria', headerShown: false }} />
        <Stack.Screen name="NovoOrcamento" component={NovoOrcamentoScreen} options={{ title: 'Novo Orçamento' }} />
        <Stack.Screen name="OrdensServico" component={OrdensServicoScreen} options={{ title: 'Produção' }} />
        <Stack.Screen name="Materiais" component={MateriaisScreen} options={{ title: 'Materiais' }} />
        <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Clientes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
