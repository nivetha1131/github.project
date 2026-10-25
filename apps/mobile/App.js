import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseReady } from './firebase';
import { demoOrders, productCatalog, serviceBookings } from './data/products';

const Tab = createBottomTabNavigator();

const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const sellerRoleLabel = (role) => (role === 'Dealer' ? 'Wholesale' : 'Retail');

const getProductPrice = (product, role) => (
  role === 'Dealer' ? product.dealerPrice : product.price
);

export default function App() {
  const [role, setRole] = useState('Customer');
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('customer@pureflow.app');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState([
    {
      id: 'prod-1',
      name: 'AquaPure 1 RO+UV',
      price: 3899,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    },
  ]);
  const [orders, setOrders] = useState(demoOrders);
  const [serviceList, setServiceList] = useState(serviceBookings);
  const [profile, setProfile] = useState({
    name: 'Riya Sharma',
    phone: '+91 98765 43210',
    email: 'riya@pureflow.app',
    referral: 'PUREFLOW10',
  });
  const [locationText, setLocationText] = useState('Location not captured');
  const [imageUri, setImageUri] = useState('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80');

  useEffect(() => {
    const loadSession = async () => {
      const savedRole = await AsyncStorage.getItem('pureflow-role');
      const savedLogin = await AsyncStorage.getItem('pureflow-login');
      const savedEmail = await AsyncStorage.getItem('pureflow-user-email');

      if (savedRole) {
        setRole(savedRole);
      } else {
        setRole('Customer');
      }

      if (savedEmail) {
        setAuthEmail(savedEmail);
      }

      setLoggedIn(savedLogin === 'true');
    };

    loadSession();
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    setupNotifications();
  }, []);

  const triggerNotification = async (title, body) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } catch (error) {
      console.log('Notification skipped:', error);
    }
  };

  const handleLogin = async (selectedRole) => {
    const cleanedEmail = authEmail.trim();
    const cleanedPassword = authPassword.trim();

    if (firebaseReady && cleanedEmail && cleanedPassword) {
      try {
        setAuthLoading(true);
        setAuthError('');

        if (authMode === 'signup') {
          await createUserWithEmailAndPassword(auth, cleanedEmail, cleanedPassword);
        } else {
          await signInWithEmailAndPassword(auth, cleanedEmail, cleanedPassword);
        }
      } catch (error) {
        setAuthError(error?.message || 'Authentication failed.');
        setAuthLoading(false);
        return;
      }
    } else if (firebaseReady && (!cleanedEmail || !cleanedPassword)) {
      setAuthError('Enter an email and password to continue.');
      return;
    }

    const resolvedRole = selectedRole || role;
    setRole(resolvedRole);
    setLoggedIn(true);
    await AsyncStorage.setItem('pureflow-role', resolvedRole);
    await AsyncStorage.setItem('pureflow-login', 'true');
    await AsyncStorage.setItem('pureflow-user-email', cleanedEmail || 'demo@pureflow.app');
    setAuthLoading(false);
    setAuthError('');
  };

  const handleLogout = async () => {
    try {
      if (firebaseReady && auth && auth.currentUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.log('Logout fallback:', error);
    }

    setLoggedIn(false);
    await AsyncStorage.setItem('pureflow-login', 'false');
  };

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return productCatalog.filter((product) => {
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [searchText]);

  const addToCart = (product) => {
    const price = getProductPrice(product, role);
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
      return;
    }

    setCart((current) => [
      ...current,
      {
        id: product.id,
        name: product.name,
        price,
        qty: 1,
        image: product.image,
      },
    ]);
  };

  const updateQty = (id, delta) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async () => {
    if (!cart.length) {
      Alert.alert('Cart empty', 'Add items before checkout.');
      return;
    }

    const newOrder = {
      id: `ORD-${Math.floor(9000 + Math.random() * 1000)}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Paid',
      total,
      items: cart.map((item) => `${item.name} x${item.qty}`),
    };

    setOrders((current) => [newOrder, ...current]);
    setCart([]);
    await triggerNotification('Order placed', 'Your water purifier order is confirmed.');
    Alert.alert('Payment successful', `Razorpay test mode approved for ${formatCurrency(total)}.`);
  };

  const handleServiceBooking = async (type) => {
    const booking = {
      id: `SER-${Math.floor(400 + Math.random() * 100)}`,
      type,
      date: '03 Nov 2026',
      status: 'Confirmed',
      address: locationText !== 'Location not captured' ? locationText : 'Madhapur, Hyderabad',
    };
    setServiceList((current) => [booking, ...current]);
    await triggerNotification('Service booked', `${type} appointment confirmed.`);
    Alert.alert('Service confirmed', `${type} has been scheduled.`);
  };

  const handleProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to choose a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets?.[0]?.uri || imageUri);
    }
  };

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location permission required');
      return;
    }
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const coords = `${current.coords.latitude.toFixed(4)}, ${current.coords.longitude.toFixed(4)}`;
    setLocationText(`GPS: ${coords}`);
    Alert.alert('Location captured', coords);
  };

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <LinearGradient colors={['#eafaf7', '#ffffff']} style={styles.authGradient}>
          <View style={styles.authPanel}>
            <Text style={styles.brand}>PureFlow</Text>
            <Text style={styles.heroTitle}>Water Purifier Commerce</Text>
            <Text style={styles.heroSubtitle}>Smart home hydration for homes and dealers</Text>

            <Text style={styles.label}>Select your role</Text>
            <View style={styles.roleRow}>
              {['Customer', 'Dealer', 'Admin'].map((entry) => (
                <Pressable
                  key={entry}
                  onPress={() => setRole(entry)}
                  style={[styles.roleCard, role === entry && styles.roleCardSelected]}
                >
                  <Text style={[styles.roleText, role === entry && styles.roleTextSelected]}>{entry}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.authToggleRow}>
              {['login', 'signup'].map((mode) => (
                <Pressable
                  key={mode}
                  style={[styles.authToggle, authMode === mode && styles.authToggleActive]}
                  onPress={() => setAuthMode(mode)}
                >
                  <Text style={[styles.authToggleText, authMode === mode && styles.authToggleTextActive]}>
                    {mode === 'login' ? 'Login' : 'Sign up'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              value={authEmail}
              onChangeText={setAuthEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={authPassword}
              onChangeText={setAuthPassword}
              placeholder="Password"
              secureTextEntry
            />

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={() => handleLogin(role)} disabled={authLoading}>
              <Text style={styles.primaryButtonText}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? `Log in as ${role}` : `Create ${role} account`}
              </Text>
            </Pressable>

            <Text style={styles.footerNote}>Firebase-ready configuration. Demo mode active until real keys are added.</Text>
            <Text style={[styles.footerNote, { color: firebaseReady ? '#0b8e6d' : '#d46b00' }]}>
              {firebaseReady ? 'Firebase connected' : 'Using mock data and local state'}
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const CatalogScreen = () => (
    <View style={styles.screenWrap}>
      <Text style={styles.sectionTitle}>Catalogue</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search purifier, pump, filter..."
        value={searchText}
        onChangeText={setSearchText}
      />
      <ScrollView contentContainerStyle={styles.catalogList}>
        {filteredProducts.map((product) => {
          const price = getProductPrice(product, role);
          return (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productMeta}>
                <Text style={styles.categoryLabel}>{product.category}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.priceText}>{formatCurrency(price)}</Text>
                <Text style={styles.metaText}>⭐ {product.rating} / 5 • Stock {product.stock}</Text>
                <Text style={styles.metaText}>{product.description}</Text>
                <Pressable style={styles.primaryButton} onPress={() => addToCart(product)}>
                  <Text style={styles.primaryButtonText}>Add to cart</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const CartScreen = () => (
    <View style={styles.screenWrap}>
      <Text style={styles.sectionTitle}>Cart</Text>
      {cart.length === 0 ? (
        <Text style={styles.emptyState}>Your cart is empty. Add a purifier or filter.</Text>
      ) : (
        <>
          {cart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.cartThumb} />
              <View style={styles.cartDetails}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.priceText}>{formatCurrency(item.price)}</Text>
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyButton} onPress={() => updateQty(item.id, -1)}>
                    <Text>-</Text>
                  </Pressable>
                  <Text style={styles.qtyValue}>{item.qty}</Text>
                  <Pressable style={styles.qtyButton} onPress={() => updateQty(item.id, 1)}>
                    <Text>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.checkoutBox}>
            <Text style={styles.summaryTitle}>Order summary</Text>
            <Text style={styles.summaryRow}>Subtotal: {formatCurrency(total)}</Text>
            <Text style={styles.summaryRow}>Shipping: Free</Text>
            <Text style={[styles.summaryRow, styles.totalRow]}>Total: {formatCurrency(total)}</Text>
            <Pressable style={styles.primaryButton} onPress={handleCheckout}>
              <Text style={styles.primaryButtonText}>Pay with Razorpay Test</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );

  const OrdersScreen = () => (
    <View style={styles.screenWrap}>
      <Text style={styles.sectionTitle}>Orders</Text>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={styles.statusPill}>{order.status}</Text>
          </View>
          <Text style={styles.orderMeta}>{order.date}</Text>
          {order.items.map((item, index) => (
            <Text key={`${order.id}-${index}`} style={styles.orderMeta}>{item}</Text>
          ))}
          <Text style={styles.totalText}>{formatCurrency(order.total)}</Text>
        </View>
      ))}
    </View>
  );

  const ServiceScreen = () => (
    <View style={styles.screenWrap}>
      <Text style={styles.sectionTitle}>Service Desk</Text>
      <Pressable style={styles.primaryButton} onPress={() => handleServiceBooking('Annual maintenance')}>
        <Text style={styles.primaryButtonText}>Book annual maintenance</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => handleServiceBooking('Filter replacement')}>
        <Text style={styles.secondaryButtonText}>Book filter replacement</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={captureLocation}>
        <Text style={styles.secondaryButtonText}>Capture delivery location</Text>
      </Pressable>

      <View style={styles.locationBox}>
        <Text style={styles.summaryTitle}>Delivery address</Text>
        <Text style={styles.orderMeta}>{locationText}</Text>
      </View>

      {serviceList.map((booking) => (
        <View key={booking.id} style={styles.orderCard}>
          <Text style={styles.orderId}>{booking.id}</Text>
          <Text style={styles.orderMeta}>{booking.type}</Text>
          <Text style={styles.orderMeta}>{booking.date}</Text>
          <Text style={styles.orderMeta}>{booking.address}</Text>
          <Text style={styles.statusPill}>{booking.status}</Text>
        </View>
      ))}
    </View>
  );

  const ProfileScreen = () => (
    <View style={styles.screenWrap}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.profileHeader}>
        <Image source={{ uri: imageUri }} style={styles.avatar} />
        <Pressable style={styles.secondaryButton} onPress={handleProfileImage}>
          <Text style={styles.secondaryButtonText}>Upload photo</Text>
        </Pressable>
      </View>

      <View style={styles.profileBox}>
        <Text style={styles.profileLabel}>Name</Text>
        <Text style={styles.profileValue}>{profile.name}</Text>
        <Text style={styles.profileLabel}>Phone</Text>
        <Text style={styles.profileValue}>{profile.phone}</Text>
        <Text style={styles.profileLabel}>Email</Text>
        <Text style={styles.profileValue}>{profile.email}</Text>
        <Text style={styles.profileLabel}>Referral code</Text>
        <Text style={styles.profileValue}>{profile.referral}</Text>
        <Text style={styles.profileLabel}>Role</Text>
        <Text style={styles.profileValue}>{sellerRoleLabel(role)}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={handleLogout}>
        <Text style={styles.primaryButtonText}>Logout</Text>
      </Pressable>
    </View>
  );

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          tabBarStyle: { backgroundColor: '#0f172a', borderTopWidth: 0 },
          tabBarActiveTintColor: '#7dd3fc',
          tabBarInactiveTintColor: '#dbeafe',
          headerTintColor: '#fff',
        }}
      >
        <Tab.Screen name="Catalog" options={{ tabBarLabel: 'Shop' }}>
          {() => <CatalogScreen />}
        </Tab.Screen>
        <Tab.Screen name="Cart" options={{ tabBarLabel: 'Cart' }}>
          {() => <CartScreen />}
        </Tab.Screen>
        <Tab.Screen name="Orders" options={{ tabBarLabel: 'Orders' }}>
          {() => <OrdersScreen />}
        </Tab.Screen>
        <Tab.Screen name="Service" options={{ tabBarLabel: 'Service' }}>
          {() => <ServiceScreen />}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
          {() => <ProfileScreen />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#e8f6f1',
  },
  authGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  authPanel: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#475569',
    marginBottom: 18,
  },
  label: {
    fontWeight: '700',
    marginBottom: 10,
    color: '#0f172a',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  roleCardSelected: {
    backgroundColor: '#0ea5e9',
  },
  roleText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  roleTextSelected: {
    color: '#fff',
  },
  authToggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
  },
  authToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  authToggleActive: {
    backgroundColor: '#fff',
  },
  authToggleText: {
    color: '#475569',
    fontWeight: '700',
  },
  authToggleTextActive: {
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ecfeff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 14,
    color: '#475569',
    textAlign: 'center',
    fontSize: 12,
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 8,
    fontWeight: '600',
  },
  screenWrap: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    color: '#0f172a',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderColor: '#dbeafe',
    borderWidth: 1,
    marginBottom: 14,
  },
  catalogList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productMeta: {
    padding: 14,
  },
  categoryLabel: {
    color: '#0369a1',
    fontWeight: '700',
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  priceText: {
    color: '#0f766e',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  metaText: {
    color: '#475569',
    marginBottom: 8,
  },
  emptyState: {
    color: '#475569',
    fontSize: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cartThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  cartDetails: {
    flex: 1,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    paddingHorizontal: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkoutBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  summaryRow: {
    color: '#475569',
    marginBottom: 6,
  },
  totalRow: {
    fontWeight: '800',
    color: '#0f172a',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: '800',
    color: '#0f172a',
  },
  statusPill: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    overflow: 'hidden',
  },
  orderMeta: {
    color: '#475569',
    marginTop: 6,
  },
  totalText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  profileLabel: {
    color: '#64748b',
    fontWeight: '700',
    marginTop: 8,
  },
  profileValue: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },
});
