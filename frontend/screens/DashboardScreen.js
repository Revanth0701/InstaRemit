import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, useWindowDimensions, Image } from 'react-native';
// Added AsyncStorage for secure user ID retrieval
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [appStep, setAppStep] = useState(1);
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768; 

  const [recipient, setRecipient] = useState('');
  const [account, setAccount] = useState('');
  const [routing, setRouting] = useState('');
  const [swift, setSwift] = useState('');
  
  const [sendAmountInr, setSendAmountInr] = useState('100000');
  const [exchangeRate, setExchangeRate] = useState(83.50);

  useEffect(() => {
    const fetchLiveRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates && data.rates.INR) {
          setExchangeRate(data.rates.INR); 
        }
      } catch (error) {
        console.error("Failed to connect to currency market.");
      }
    };
    fetchLiveRate();
  }, []);

  const feePercentage = 0.03; 
  const rawInr = parseFloat(sendAmountInr.replace(/,/g, '')) || 0;
  const feeAmount = rawInr * feePercentage;
  const convertedInr = rawInr - feeAmount;
  const receiveAmountUsd = (convertedInr / exchangeRate).toFixed(2);

  const formatNum = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const [paymentMethod, setPaymentMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  
  const [indianAccountName, setIndianAccountName] = useState('');
  const [indianBankName, setIndianBankName] = useState('');
  const [indianAccount, setIndianAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      // 1. Grab the secure User ID
      const senderId = await AsyncStorage.getItem('instaremit_user_id');
      if (!senderId) return; // If they aren't logged in, stop here.

      // 2. Ask FastAPI for this specific user's history
      const response = await fetch(`http://127.0.0.1:8000/transactions/?sender_id=${senderId}`);
      
      if (response.ok) {
        const dbTransactions = await response.json();
        
        // 3. Format the data to look beautiful in our UI
        const formattedTransactions = dbTransactions.map(tx => {
          const dateObj = new Date(tx.created_at);
          const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            id: tx.transaction_id,
            dateLabel: dateLabel,
            route: `Sent to ${tx.recipient_name}`,
            amount: `- ₹ ${formatNum(tx.gross_amount)}`,
            isPositive: false
          };
        });
        
        // 4. Update the screen!
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error("Could not fetch transactions", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleProceedFromPayment = () => {
    if (paymentMethod === 'netbanking') {
      setAppStep(5);
    } else {
      handleTransferSubmit(); 
    }
  };

  // UPDATED: Now fetches the sender ID and hits the correct FastAPI route
  const handleTransferSubmit = async () => {
    try {
      const senderId = await AsyncStorage.getItem('instaremit_user_id');
      
      if (!senderId) {
        alert("Authentication Error: Please log out and log back in.");
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/transactions/create?sender_id=${senderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipient || "Anonymous Receiver",
          gross_amount: rawInr
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppStep(6); 
        fetchTransactions(); 
      } else {
        const errorData = await response.json();
        alert(`Pipeline Error: ${errorData.detail}`);
      }
    } catch (error) {
      alert("Network Error: Could not connect to the backend server.");
    }
  };

  const resetFlow = () => {
    setAppStep(1); 
    setPaymentMethod(''); 
    setIsUpiVerified(false); 
    setSendAmountInr('100000');
    setIndianAccountName('');
    setIndianBankName('');
    setIndianAccount('');
    setIfscCode('');
  };

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.desktopContainer}>
        <View style={styles.desktopSidebar}>
          <View>
            <Image source={require('../assets/logo1.png')} style={styles.desktopLogo} />
            <View style={styles.desktopNavMenu}>
              <TouchableOpacity style={[styles.navItem, appStep === 1 && styles.navItemActive]} onPress={() => setAppStep(1)}>
                <Text style={styles.navIcon}>🏠</Text>
                <Text style={[styles.navText, appStep === 1 && styles.navTextActive]}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, (appStep > 1 && appStep < 7) && styles.navItemActive]} onPress={() => setAppStep(2)}>
                <Text style={styles.navIcon}>💸</Text>
                <Text style={[styles.navText, (appStep > 1 && appStep < 7) && styles.navTextActive]}>Send Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, appStep === 7 && styles.navItemActive]} onPress={() => setAppStep(7)}>
                <Text style={styles.navIcon}>📋</Text>
                <Text style={[styles.navText, appStep === 7 && styles.navTextActive]}>History</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => {
              AsyncStorage.removeItem('instaremit_user_id'); // Clear ID on logout
              navigation.replace('Login');
          }}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.desktopMainContent}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopScrollContent} showsVerticalScrollIndicator={true}>
            
            {appStep === 1 && (
              <View>
                <View style={styles.desktopBlueBanner}>
                  <View style={styles.bannerTopRow}>
                    <View style={styles.profileInfo}>
                      <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>🧑</Text></View>
                      <Text style={styles.greetingText}>Hi, Revanth</Text>
                    </View>
                  </View>
                  <View style={styles.bannerBalanceCenter}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <View style={styles.balanceRowCenter}>
                      <Text style={styles.balanceAmount}>₹ 16,87,663</Text>
                      <View style={styles.currencyPill}><Text style={styles.currencyPillText}>INR ▾</Text></View>
                    </View>
                  </View>
                </View>

                <View style={styles.desktopFloatingCardsRow}>
                  <TouchableOpacity style={styles.desktopActionCard} onPress={() => setAppStep(2)}>
                    <Text style={styles.desktopActionIcon}>💸</Text>
                    <Text style={styles.desktopActionText}>Send Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.desktopActionCard} onPress={() => setAppStep(7)}>
                    <Text style={styles.desktopActionIcon}>📋</Text>
                    <Text style={styles.desktopActionText}>Transaction{"\n"}History</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.desktopHistoryContainer}>
                  {transactions.map((tx, index) => (
                    <View key={index} style={styles.desktopTxGroup}>
                      {(index === 0 || transactions[index - 1].dateLabel !== tx.dateLabel) && (
                        <Text style={styles.txDateHeader}>{tx.dateLabel}</Text>
                      )}
                      <View style={styles.desktopTxRow}>
                        <View>
                          <Text style={styles.txTitle}>{tx.route}</Text>
                          <Text style={styles.txRef}>{tx.id}</Text>
                        </View>
                        <Text style={[styles.txAmount, tx.isPositive ? styles.textGreen : styles.textRed]}>
                          {tx.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {transactions.length === 0 && (
                    <Text style={{textAlign: 'center', color: '#A0AEC0', paddingVertical: 20}}>No transactions yet.</Text>
                  )}
                </View>
              </View>
            )}

            {(appStep > 1 && appStep < 7) && (
              <View style={styles.desktopWizardContainer}>
                <View style={styles.desktopWizardCard}>
                  
                  {appStep === 2 && (
                    <View>
                      <View style={styles.wizardHeader}>
                        <TouchableOpacity onPress={() => setAppStep(1)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                        <Text style={styles.wizardTitle}>US Receiver Information</Text>
                      </View>
                      <TextInput style={styles.inputBox} placeholder="Recipient Legal Name" placeholderTextColor="#A0AEC0" value={recipient} onChangeText={setRecipient} />
                      <TextInput style={styles.inputBox} placeholder="US Account Number" placeholderTextColor="#A0AEC0" value={account} onChangeText={setAccount} />
                      <TextInput style={styles.inputBox} placeholder="ACH Routing Number" placeholderTextColor="#A0AEC0" value={routing} onChangeText={setRouting} />
                      <TextInput style={styles.inputBox} placeholder="SWIFT Code" placeholderTextColor="#A0AEC0" autoCapitalize="characters" value={swift} onChangeText={setSwift} />
                      <TouchableOpacity style={styles.primaryButton} onPress={() => setAppStep(3)}><Text style={styles.primaryButtonText}>Save recipient and proceed</Text></TouchableOpacity>
                    </View>
                  )}

                  {appStep === 3 && (
                    <View>
                      <View style={styles.wizardHeader}>
                        <TouchableOpacity onPress={() => setAppStep(2)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                        <Text style={styles.wizardTitle}>Send Money to USA</Text>
                      </View>
                      <View style={styles.rateBanner}><Text style={styles.rateText}>Live Rate: 1 USD = ₹ {exchangeRate.toFixed(2)}</Text></View>
                      <Text style={styles.inputLabel}>You'll be sending (INR)</Text>
                      <View style={styles.currencyInputRow}>
                        <TextInput style={styles.currencyInput} value={sendAmountInr} onChangeText={(text) => setSendAmountInr(text.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
                        <Text style={styles.currencyTag}>INR</Text>
                      </View>
                      <Text style={styles.inputLabel}>Recipient gets (USD)</Text>
                      <View style={[styles.currencyInputRow, styles.currencyInputRowDisabled]}>
                        <TextInput style={styles.currencyInputDisabled} value={`$ ${formatNum(receiveAmountUsd)}`} editable={false} />
                        <Text style={styles.currencyTag}>USD</Text>
                      </View>
                      <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}><Text style={styles.summaryText}>Amount sent</Text><Text style={styles.summaryTextBold}>₹ {formatNum(rawInr)}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryText}>InstaRemit fee (3%)</Text><Text style={styles.textRed}>- ₹ {formatNum(feeAmount)}</Text></View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}><Text style={styles.summaryText}>Converted amount</Text><Text style={styles.textGreenLg}>$ {formatNum(receiveAmountUsd)}</Text></View>
                      </View>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => setAppStep(4)}><Text style={styles.primaryButtonText}>Proceed to Payment</Text></TouchableOpacity>
                    </View>
                  )}

                  {appStep === 4 && (
                    <View>
                      <View style={styles.wizardHeader}>
                        <TouchableOpacity onPress={() => setAppStep(3)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                        <Text style={styles.wizardTitle}>Select preferred payment option</Text>
                      </View>
                      <TouchableOpacity style={styles.paymentOptionBox} onPress={() => setPaymentMethod('upi')} activeOpacity={0.9}>
                        <View style={styles.paymentOptionHeader}>
                          <Text style={styles.paymentIcon}>📱</Text>
                          <View style={styles.paymentTextCol}><Text style={styles.paymentMethodTitle}>UPI ID</Text><Text style={styles.paymentMethodDesc}>Phonepe, Gpay, Paytm, BHIM & more</Text></View>
                          <View style={[styles.radioCircle, paymentMethod === 'upi' && styles.radioCircleSelected]}>{paymentMethod === 'upi' && <View style={styles.radioInner} />}</View>
                        </View>
                        {paymentMethod === 'upi' && (
                          <View style={styles.expandedPaymentArea}>
                            <TextInput style={styles.inputBox} placeholder="Enter your UPI ID" placeholderTextColor="#A0AEC0" value={upiId} onChangeText={(text) => {setUpiId(text); setIsUpiVerified(false);}} autoCapitalize="none" />
                            {!isUpiVerified ? (<TouchableOpacity style={styles.verifyButton} onPress={() => setIsUpiVerified(true)}><Text style={styles.verifyButtonText}>Verify</Text></TouchableOpacity>) : (<Text style={styles.verifiedText}>UPI ID Verified ✓</Text>)}
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.paymentOptionBox} onPress={() => setPaymentMethod('netbanking')} activeOpacity={0.9}>
                        <View style={styles.paymentOptionHeader}>
                          <Text style={styles.paymentIcon}>🏛️</Text>
                          <View style={styles.paymentTextCol}><Text style={styles.paymentMethodTitle}>Net Banking</Text><Text style={styles.paymentMethodDesc}>Choose your Indian bank to complete payment</Text></View>
                          <View style={[styles.radioCircle, paymentMethod === 'netbanking' && styles.radioCircleSelected]}>{paymentMethod === 'netbanking' && <View style={styles.radioInner} />}</View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.primaryButton, (!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)) && styles.buttonDisabled]} onPress={handleProceedFromPayment} disabled={!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)}>
                        <Text style={styles.primaryButtonText}>Proceed</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {appStep === 5 && (
                    <View>
                      <View style={styles.wizardHeader}>
                        <TouchableOpacity onPress={() => setAppStep(4)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                        <Text style={styles.wizardTitle}>Enter Indian Bank Details</Text>
                      </View>
                      <TextInput style={styles.inputBox} placeholder="Recipient Name" placeholderTextColor="#A0AEC0" value={indianAccountName} onChangeText={setIndianAccountName} />
                      <TextInput style={styles.inputBox} placeholder="Bank Name (e.g., SBI, HDFC)" placeholderTextColor="#A0AEC0" value={indianBankName} onChangeText={setIndianBankName} />
                      <TextInput style={styles.inputBox} placeholder="Account Number" placeholderTextColor="#A0AEC0" value={indianAccount} onChangeText={setIndianAccount} keyboardType="number-pad" />
                      <TextInput style={styles.inputBox} placeholder="IFSC Code" placeholderTextColor="#A0AEC0" autoCapitalize="characters" value={ifscCode} onChangeText={setIfscCode} />
                      <TouchableOpacity style={[styles.primaryButton, (!indianAccountName || !indianBankName || !indianAccount || !ifscCode) && styles.buttonDisabled]} onPress={handleTransferSubmit} disabled={!indianAccountName || !indianBankName || !indianAccount || !ifscCode}>
                        <Text style={styles.primaryButtonText}>Pay ₹ {formatNum(rawInr)} Securely</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {appStep === 6 && (
                    <View style={{alignItems: 'center', paddingVertical: 40}}>
                      <Text style={{fontSize: 60, marginBottom: 20}}>✅</Text>
                      <Text style={{fontSize: 22, fontWeight: '700', color: '#1A202C', marginBottom: 10}}>Transfer Initiated!</Text>
                      <Text style={{fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 30}}>Your money will be sent to the US in 15 minutes.</Text>
                      <TouchableOpacity style={styles.primaryButton} onPress={resetFlow}><Text style={styles.primaryButtonText}>Go back to home</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {appStep === 7 && (
              <View style={styles.desktopWizardContainer}>
                <View style={[styles.desktopWizardCard, {maxWidth: 800}]}>
                  <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => setAppStep(1)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                    <Text style={styles.wizardTitle}>Complete Transaction History</Text>
                  </View>
                  
                  {transactions.map((tx, index) => (
                    <View key={index} style={styles.desktopTxGroup}>
                      {(index === 0 || transactions[index - 1].dateLabel !== tx.dateLabel) && (
                        <Text style={styles.txDateHeader}>{tx.dateLabel}</Text>
                      )}
                      <View style={styles.desktopTxRow}>
                        <View>
                          <Text style={styles.txTitle}>{tx.route}</Text>
                          <Text style={styles.txRef}>{tx.id}</Text>
                        </View>
                        <Text style={[styles.txAmount, tx.isPositive ? styles.textGreen : styles.textRed]}>
                          {tx.amount}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {transactions.length === 0 && (
                    <Text style={{textAlign: 'center', color: '#A0AEC0', paddingVertical: 20}}>No transactions yet.</Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={appStep === 1 ? "light-content" : "dark-content"} backgroundColor={appStep === 1 ? "#003DA5" : "#FFFFFF"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollWrapper} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
          
          {appStep === 1 && (
            <View style={styles.fullHeight}>
              <View style={styles.blueHeaderBlock}>
                <View style={styles.headerTopRow}>
                  <View style={styles.profileInfo}>
                    <Image source={require('../assets/logo1.png')} style={styles.mobileAvatarPlaceholder} />
                    <Text style={styles.greetingText}>Hi, Revanth</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <View style={styles.balanceRowCenter}>
                    <Text style={styles.balanceAmount}>₹ 16,87,663</Text>
                    <View style={styles.currencyPill}><Text style={styles.currencyPillText}>INR ▾</Text></View>
                  </View>
                </View>
              </View>
              
              <View style={styles.floatingCardsRow}>
                <TouchableOpacity style={styles.quickActionCard} onPress={() => setAppStep(2)} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>💸</Text>
                  <Text style={styles.quickActionText}>Send Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard} onPress={() => setAppStep(7)} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>📋</Text>
                  <Text style={styles.quickActionText}>Transaction{"\n"}History</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.transactionListContainer}>
                {transactions.map((tx, index) => (
                  <View key={index}>
                    {(index === 0 || transactions[index - 1].dateLabel !== tx.dateLabel) && (
                      <Text style={styles.txDateHeader}>{tx.dateLabel}</Text>
                    )}
                    <View style={styles.txRow}>
                      <View>
                        <Text style={styles.txTitle}>{tx.route}</Text>
                        <Text style={styles.txRef}>{tx.id}</Text>
                      </View>
                      <Text style={[styles.txAmount, tx.isPositive ? styles.textGreen : styles.textRed]}>
                        {tx.amount}
                      </Text>
                    </View>
                  </View>
                ))}
                {transactions.length === 0 && (
                  <Text style={{textAlign: 'center', color: '#A0AEC0', paddingVertical: 20}}>No transactions yet.</Text>
                )}
              </View>

              <View style={styles.bottomNavBar}>
                 <TouchableOpacity style={styles.navTabActive} onPress={() => setAppStep(1)}>
                    <Text style={styles.navTabIconActive}>🏠</Text>
                    <Text style={styles.navTabTextActive}>Home</Text>
                 </TouchableOpacity>
                 <View style={styles.navTab}>
                    <Text style={styles.navTabIcon}>👤</Text>
                 </View>
              </View>
            </View>
          )}

          {(appStep > 1 && appStep < 7) && (
            <View style={styles.wizardPad}>
              {appStep === 2 && (
                <View>
                  <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => setAppStep(1)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                    <Text style={styles.wizardTitle}>US Receiver Information</Text>
                  </View>
                  <TextInput style={styles.inputBox} placeholder="Recipient Legal Name" placeholderTextColor="#A0AEC0" value={recipient} onChangeText={setRecipient} />
                  <TextInput style={styles.inputBox} placeholder="US Account Number" placeholderTextColor="#A0AEC0" keyboardType="number-pad" value={account} onChangeText={setAccount} />
                  <TextInput style={styles.inputBox} placeholder="ACH Routing Number" placeholderTextColor="#A0AEC0" keyboardType="number-pad" value={routing} onChangeText={setRouting} />
                  <TextInput style={styles.inputBox} placeholder="SWIFT Code" placeholderTextColor="#A0AEC0" autoCapitalize="characters" value={swift} onChangeText={setSwift} />
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setAppStep(3)}><Text style={styles.primaryButtonText}>Save recipient and proceed</Text></TouchableOpacity>
                </View>
              )}

              {appStep === 3 && (
                <View>
                  <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => setAppStep(2)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                    <Text style={styles.wizardTitle}>Send Money to USA</Text>
                  </View>
                  <View style={styles.rateBanner}><Text style={styles.rateText}>Live Rate: 1 USD = ₹ {exchangeRate.toFixed(2)}</Text></View>
                  <Text style={styles.inputLabel}>You'll be sending (INR)</Text>
                  <View style={styles.currencyInputRow}>
                    <TextInput style={styles.currencyInput} value={sendAmountInr} onChangeText={(text) => setSendAmountInr(text.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
                    <Text style={styles.currencyTag}>INR ▾</Text>
                  </View>
                  <Text style={styles.inputLabel}>Recipient gets (USD)</Text>
                  <View style={[styles.currencyInputRow, styles.currencyInputRowDisabled]}>
                    <TextInput style={styles.currencyInputDisabled} value={`$ ${formatNum(receiveAmountUsd)}`} editable={false} />
                    <Text style={styles.currencyTag}>USD ▾</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Transfer Summary</Text>
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>Amount sent</Text><Text style={styles.summaryTextBold}>₹ {formatNum(rawInr)}</Text></View>
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>InstaRemit fee (3%)</Text><Text style={styles.textRed}>- ₹ {formatNum(feeAmount)}</Text></View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>Converted amount</Text><View style={{alignItems: 'flex-end'}}><Text style={styles.textGreenLg}>$ {formatNum(receiveAmountUsd)}</Text><Text style={styles.summarySubText}>(₹ {formatNum(convertedInr)})</Text></View></View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setAppStep(4)}><Text style={styles.primaryButtonText}>Proceed to Payment</Text></TouchableOpacity>
                </View>
              )}

              {appStep === 4 && (
                <View>
                  <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => setAppStep(3)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                    <Text style={styles.wizardTitle}>Select preferred payment option</Text>
                  </View>
                  <TouchableOpacity style={styles.paymentOptionBox} onPress={() => setPaymentMethod('upi')} activeOpacity={0.9}>
                    <View style={styles.paymentOptionHeader}>
                      <Text style={styles.paymentIcon}>📱</Text>
                      <View style={styles.paymentTextCol}><Text style={styles.paymentMethodTitle}>UPI ID</Text><Text style={styles.paymentMethodDesc}>Phonepe, Gpay, Paytm, BHIM & more</Text></View>
                      <View style={[styles.radioCircle, paymentMethod === 'upi' && styles.radioCircleSelected]}>{paymentMethod === 'upi' && <View style={styles.radioInner} />}</View>
                    </View>
                    {paymentMethod === 'upi' && (
                      <View style={styles.expandedPaymentArea}>
                        <TextInput style={styles.inputBox} placeholder="Enter your UPI ID" placeholderTextColor="#A0AEC0" value={upiId} onChangeText={(text) => {setUpiId(text); setIsUpiVerified(false);}} autoCapitalize="none" />
                        {!isUpiVerified ? (<TouchableOpacity style={styles.verifyButton} onPress={() => setIsUpiVerified(true)}><Text style={styles.verifyButtonText}>Verify</Text></TouchableOpacity>) : (<Text style={styles.verifiedText}>UPI ID Verified ✓</Text>)}
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.paymentOptionBox} onPress={() => setPaymentMethod('netbanking')} activeOpacity={0.9}>
                    <View style={styles.paymentOptionHeader}>
                      <Text style={styles.paymentIcon}>🏛️</Text>
                      <View style={styles.paymentTextCol}><Text style={styles.paymentMethodTitle}>Net Banking</Text><Text style={styles.paymentMethodDesc}>Choose your Indian bank to complete payment</Text></View>
                      <View style={[styles.radioCircle, paymentMethod === 'netbanking' && styles.radioCircleSelected]}>{paymentMethod === 'netbanking' && <View style={styles.radioInner} />}</View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryButton, (!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)) && styles.buttonDisabled]} onPress={handleProceedFromPayment} disabled={!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)}><Text style={styles.primaryButtonText}>Proceed</Text></TouchableOpacity>
                </View>
              )}

              {appStep === 5 && (
                <View>
                  <View style={styles.wizardHeader}>
                    <TouchableOpacity onPress={() => setAppStep(4)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                    <Text style={styles.wizardTitle}>Enter Indian Bank Details</Text>
                  </View>
                  <TextInput style={styles.inputBox} placeholder="Recipient Name" placeholderTextColor="#A0AEC0" value={indianAccountName} onChangeText={setIndianAccountName} />
                  <TextInput style={styles.inputBox} placeholder="Bank Name (e.g., SBI, HDFC)" placeholderTextColor="#A0AEC0" value={indianBankName} onChangeText={setIndianBankName} />
                  <TextInput style={styles.inputBox} placeholder="Account Number" placeholderTextColor="#A0AEC0" value={indianAccount} onChangeText={setIndianAccount} keyboardType="number-pad" />
                  <TextInput style={styles.inputBox} placeholder="IFSC Code" placeholderTextColor="#A0AEC0" autoCapitalize="characters" value={ifscCode} onChangeText={setIfscCode} />
                  <TouchableOpacity style={[styles.primaryButton, (!indianAccountName || !indianBankName || !indianAccount || !ifscCode) && styles.buttonDisabled]} onPress={handleTransferSubmit} disabled={!indianAccountName || !indianBankName || !indianAccount || !ifscCode}>
                    <Text style={styles.primaryButtonText}>Pay ₹ {formatNum(rawInr)} Securely</Text>
                  </TouchableOpacity>
                </View>
              )}

              {appStep === 6 && (
                <View style={{alignItems: 'center', paddingVertical: 40}}>
                  <Text style={{fontSize: 60, marginBottom: 20}}>✅</Text>
                  <Text style={{fontSize: 22, fontWeight: '700', color: '#1A202C', marginBottom: 10}}>Transfer Initiated!</Text>
                  <Text style={{fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 30}}>Your money will be sent to the US in 15 minutes!</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={resetFlow}><Text style={styles.primaryButtonText}>Go back to home</Text></TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {appStep === 7 && (
            <View style={styles.wizardPad}>
              <View style={styles.wizardHeader}>
                <TouchableOpacity onPress={() => setAppStep(1)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                <Text style={styles.wizardTitle}>Transaction History</Text>
              </View>
              {transactions.map((tx, index) => (
                <View key={index}>
                  {(index === 0 || transactions[index - 1].dateLabel !== tx.dateLabel) && (
                    <Text style={styles.txDateHeader}>{tx.dateLabel}</Text>
                  )}
                  <View style={styles.txRow}>
                    <View>
                      <Text style={styles.txTitle}>{tx.route}</Text>
                      <Text style={styles.txRef}>{tx.id}</Text>
                    </View>
                    <Text style={[styles.txAmount, tx.isPositive ? styles.textGreen : styles.textRed]}>
                      {tx.amount}
                    </Text>
                  </View>
                </View>
              ))}
              {transactions.length === 0 && (
                <Text style={{textAlign: 'center', color: '#A0AEC0', paddingVertical: 20}}>No transactions yet.</Text>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollWrapper: { flexGrow: 1, paddingBottom: 150 }, 
  fullHeight: { flex: 1 },
  wizardPad: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 150, backgroundColor: '#FFFFFF' }, 
  
  blueHeaderBlock: { backgroundColor: '#003DA5', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 80, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  mobileAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CBD5E0', marginRight: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  greetingText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  balanceLabel: { color: '#E2E8F0', fontSize: 14, marginBottom: 8 },
  balanceRowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  balanceAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginRight: 12 },
  currencyPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currencyPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  floatingCardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 20, marginTop: -50 },
  quickActionCard: { backgroundColor: '#FFFFFF', width: '47%', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  quickActionIcon: { fontSize: 28, marginBottom: 12 },
  quickActionText: { fontSize: 11, color: '#4A5568', textAlign: 'center', fontWeight: '500', lineHeight: 14 },
  
  transactionListContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  txDateHeader: { fontSize: 12, color: '#A0AEC0', fontWeight: '500', marginBottom: 12, marginTop: 16 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  txTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginBottom: 4 },
  txRef: { fontSize: 11, color: '#A0AEC0' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  textGreen: { color: '#38A169' },
  textRed: { color: '#E53E3E' },
  
  bottomNavBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navTabActive: { backgroundColor: '#0047AB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 40 },
  navTabIconActive: { fontSize: 16, marginRight: 8, color: '#FFF' },
  navTabTextActive: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  navTab: { paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center' },
  navTabIcon: { fontSize: 20, color: '#A0AEC0' },

  wizardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backArrow: { fontSize: 22, color: '#1A202C', marginRight: 16, fontWeight: '600' },
  wizardTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C' },
  inputBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FFFFFF', marginBottom: 12 },
  inputLabel: { fontSize: 14, color: '#4A5568', marginBottom: 8, fontWeight: '500' },
  currencyInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, marginBottom: 16 },
  currencyInputRowDisabled: { backgroundColor: '#F7FAFC' },
  currencyInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '600', color: '#1A202C' },
  currencyInputDisabled: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '700', color: '#38A169' },
  currencyTag: { fontSize: 14, color: '#718096', fontWeight: '600', backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  rateBanner: { backgroundColor: '#EBF8FF', padding: 10, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  rateText: { color: '#0047AB', fontWeight: '600', fontSize: 14 },
  summaryCard: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, padding: 16, marginTop: 10 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#4A5568' },
  summaryTextBold: { fontSize: 14, fontWeight: '600', color: '#1A202C' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  summarySubText: { fontSize: 12, color: '#718096', marginTop: 4 },
  textGreenLg: { color: '#38A169', fontSize: 18, fontWeight: '700' },
  
  paymentOptionBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 12 },
  paymentOptionHeader: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: { fontSize: 24, marginRight: 16 },
  paymentTextCol: { flex: 1 },
  paymentMethodTitle: { fontSize: 15, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  paymentMethodDesc: { fontSize: 12, color: '#718096' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E0', justifyContent: 'center', alignItems: 'center' },
  radioCircleSelected: { borderColor: '#38A169' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38A169' },
  expandedPaymentArea: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  verifyButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0047AB', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  verifyButtonText: { color: '#0047AB', fontWeight: '600', fontSize: 14 },
  verifiedText: { color: '#38A169', fontWeight: '600', fontSize: 14, textAlign: 'right', marginTop: -10 },
  
  primaryButton: { backgroundColor: '#0047AB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16, marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#A0AEC0' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  
  desktopContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F0F2F5' },
  desktopSidebar: { width: 250, backgroundColor: '#FFFFFF', padding: 24, borderRightWidth: 1, borderRightColor: '#E2E8F0', justifyContent: 'space-between' },
  desktopLogo: { width: 140, height: 40, resizeMode: 'contain', marginBottom: 40 },
  desktopNavMenu: { gap: 12 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  navItemActive: { backgroundColor: '#EBF8FF' },
  navIcon: { fontSize: 18, marginRight: 12 },
  navText: { fontSize: 15, color: '#4A5568', fontWeight: '500' },
  navTextActive: { color: '#0047AB', fontWeight: '600' },
  logoutButton: { padding: 16 },
  logoutText: { color: '#E53E3E', fontSize: 15, fontWeight: '600' },
  
  desktopMainContent: { flex: 1 }, 
  desktopScrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 }, 
  desktopBlueBanner: { backgroundColor: '#003DA5', borderRadius: 20, padding: 40, paddingBottom: 80 },
  bannerBalanceCenter: { alignItems: 'center' },
  
  desktopFloatingCardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: -50, paddingHorizontal: 20 },
  desktopActionCard: { backgroundColor: '#FFFFFF', width: 200, paddingVertical: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  desktopActionIcon: { fontSize: 32, marginBottom: 16 },
  desktopActionText: { fontSize: 14, color: '#1A202C', textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  
  desktopHistoryContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, marginTop: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  desktopTxGroup: { marginBottom: 10 },
  desktopTxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  
  desktopWizardContainer: { width: '100%', alignItems: 'center', paddingTop: 0 }, 
  desktopWizardCard: { 
    backgroundColor: '#FFFFFF', width: '100%', maxWidth: 500, borderRadius: 16, 
    paddingHorizontal: 30, paddingTop: 24, paddingBottom: 24, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 
  }
});