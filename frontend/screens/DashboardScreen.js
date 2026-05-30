import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StatusBar, useWindowDimensions, Image } from 'react-native';

export default function DashboardScreen({ navigation }) {
  const [appStep, setAppStep] = useState(1);
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768; 

  // Transfer Form States
  const [recipient, setRecipient] = useState('');
  const [account, setAccount] = useState('');
  const [routing, setRouting] = useState('');
  const [swift, setSwift] = useState('');
  
  const [sendAmountInr, setSendAmountInr] = useState('100000');
  
  // LIVE EXCHANGE RATE STATE & FETCH
  const [exchangeRate, setExchangeRate] = useState(83.50); // Fallback rate

  useEffect(() => {
    const fetchLiveRate = async () => {
      try {
        const response = await fetch('https://instaremit.onrender.com/transactions/');
        const data = await response.json();
        if (data && data.rates && data.rates.INR) {
          setExchangeRate(data.rates.INR); // Overwrites 83.50 with the real-time market rate
        }
      } catch (error) {
        console.error("Failed to connect to currency market. Using fallback rate.");
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

  // THE PYTHON API CONNECTION BRIDGE
  const handleTransferSubmit = async () => {
    try {
      // Send the data to your local Python Server
      const response = await fetch('http://127.0.0.1:8000/transactions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: recipient || "Anonymous Receiver",
          gross_amount_inr: rawInr
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Successfully saved to database! Transaction ID:", data.transaction_id);
        setAppStep(5); // Move to the success screen!
      } else {
        alert("Pipeline Error: Could not write to the SQL database.");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Is your Python server running?");
    }
  };

  // Customer Transaction History (Matching your Figma Design)
  const transactions = [
    { id: 'TXN3950384290548', dateLabel: 'Today', route: 'USD → INR', amount: '- $280', isPositive: false },
    { id: 'TXN3950384299089', dateLabel: 'Yesterday', route: 'INR → USD', amount: '+ $1200', isPositive: true },
    { id: 'TXN3950384290368', dateLabel: 'Yesterday', route: 'USD → INR', amount: '- $120', isPositive: false },
  ];

  /* ==========================================================================
     DESKTOP LAYOUT (Customer Web Portal)
     ========================================================================== */
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.desktopContainer}>
        {/* LEFT SIDEBAR NAVIGATION */}
        <View style={styles.desktopSidebar}>
          <View>
            <Image source={require('../assets/logo1.png')} style={styles.desktopLogo} />
            <View style={styles.desktopNavMenu}>
              <TouchableOpacity style={[styles.navItem, appStep === 1 && styles.navItemActive]} onPress={() => setAppStep(1)}>
                <Text style={styles.navIcon}>🏠</Text>
                <Text style={[styles.navText, appStep === 1 && styles.navTextActive]}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navItem, appStep > 1 && styles.navItemActive]} onPress={() => setAppStep(2)}>
                <Text style={styles.navIcon}>💸</Text>
                <Text style={[styles.navText, appStep > 1 && styles.navTextActive]}>Send Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem}>
                <Text style={styles.navIcon}>⚙️</Text>
                <Text style={styles.navText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.replace('Login')}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN CONTENT WORKSPACE */}
        <View style={styles.desktopMainContent}>
          <ScrollView contentContainerStyle={styles.desktopScrollContent} showsVerticalScrollIndicator={false}>
            
            {/* HOME DASHBOARD */}
            {appStep === 1 && (
              <View>
                {/* BLUE HEADER BANNER */}
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

                {/* FLOATING ACTION CARDS */}
                <View style={styles.desktopFloatingCardsRow}>
                  <TouchableOpacity style={styles.desktopActionCard} onPress={() => setAppStep(2)}>
                    <Text style={styles.desktopActionIcon}>💸</Text>
                    <Text style={styles.desktopActionText}>Send Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.desktopActionCard}>
                    <Text style={styles.desktopActionIcon}>🔁</Text>
                    <Text style={styles.desktopActionText}>Setup recurring{"\n"}Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.desktopActionCard}>
                    <Text style={styles.desktopActionIcon}>📋</Text>
                    <Text style={styles.desktopActionText}>Transaction{"\n"}History</Text>
                  </TouchableOpacity>
                </View>

                {/* TRANSACTION HISTORY */}
                <View style={styles.desktopHistoryContainer}>
                  {transactions.map((tx, index) => (
                    <View key={index} style={styles.desktopTxGroup}>
                      {/* Only show date header if it's the first item or different from previous */}
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
                </View>
              </View>
            )}

            {/* SEND MONEY WIZARD (Desktop Centered) */}
            {appStep > 1 && (
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
                      <TouchableOpacity style={[styles.primaryButton, {marginTop: 20}]} onPress={() => setAppStep(4)}><Text style={styles.primaryButtonText}>Proceed to Payment</Text></TouchableOpacity>
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
                      {/* THIS BUTTON NOW CALLS THE PYTHON API */}
                      <TouchableOpacity style={[styles.primaryButton, {marginTop: 20}, (!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)) && styles.buttonDisabled]} onPress={handleTransferSubmit} disabled={!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)}><Text style={styles.primaryButtonText}>Proceed to Pay ₹ {formatNum(rawInr)}</Text></TouchableOpacity>
                    </View>
                  )}

                  {appStep === 5 && (
                    <View style={{alignItems: 'center', paddingVertical: 40}}>
                      <Text style={{fontSize: 60, marginBottom: 20}}>✅</Text>
                      <Text style={{fontSize: 22, fontWeight: '700', color: '#1A202C', marginBottom: 10}}>Transfer Initiated!</Text>
                      <Text style={{fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 30}}>Your money will be sent to the US in 15 minutes.</Text>
                      <TouchableOpacity style={[styles.primaryButton, {width: '100%'}]} onPress={() => { setAppStep(1); setPaymentMethod(''); setIsUpiVerified(false); }}><Text style={styles.primaryButtonText}>Go back to home</Text></TouchableOpacity>
                    </View>
                  )}

                </View>
              </View>
            )}

          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================================================
     MOBILE LAYOUT (Matches Your Figma Exactly)
     ========================================================================== */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={appStep === 1 ? "light-content" : "dark-content"} backgroundColor={appStep === 1 ? "#003DA5" : "#FFFFFF"} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollWrapper} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
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
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>🔁</Text>
                  <Text style={styles.quickActionText}>Setup recurring{"\n"}Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>📋</Text>
                  <Text style={styles.quickActionText}>Transaction{"\n"}History</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.transactionListContainer}>
                {transactions.map((tx, index) => (
                  <View key={index}>
                    {/* Only show date header if it's the first item or different from previous */}
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
              </View>

              {/* Mobile Bottom Navigation Bar */}
              <View style={styles.bottomNavBar}>
                 <View style={styles.navTabActive}>
                    <Text style={styles.navTabIconActive}>🏠</Text>
                    <Text style={styles.navTabTextActive}>Home</Text>
                 </View>
                 <View style={styles.navTab}>
                    <Text style={styles.navTabIcon}>👤</Text>
                 </View>
              </View>
            </View>
          )}

          {/* WIZARD SCREENS 2-5 REMAIN THE SAME MOBILE DESIGN WE BUILT */}
          {appStep === 2 && (
            <View style={styles.wizardPad}>
              <View style={styles.wizardHeader}>
                <TouchableOpacity onPress={() => setAppStep(1)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                <Text style={styles.wizardTitle}>US Receiver Information</Text>
              </View>
              <TextInput style={styles.inputBox} placeholder="Recipient Legal Name" placeholderTextColor="#A0AEC0" value={recipient} onChangeText={setRecipient} />
              <TextInput style={styles.inputBox} placeholder="US Account Number" placeholderTextColor="#A0AEC0" keyboardType="number-pad" value={account} onChangeText={setAccount} />
              <TextInput style={styles.inputBox} placeholder="ACH Routing Number" placeholderTextColor="#A0AEC0" keyboardType="number-pad" value={routing} onChangeText={setRouting} />
              <TextInput style={styles.inputBox} placeholder="SWIFT Code" placeholderTextColor="#A0AEC0" autoCapitalize="characters" value={swift} onChangeText={setSwift} />
              <TouchableOpacity style={[styles.primaryButton, styles.marginTopAuto]} onPress={() => setAppStep(3)}><Text style={styles.primaryButtonText}>Save recipient and proceed</Text></TouchableOpacity>
            </View>
          )}

          {appStep === 3 && (
            <View style={styles.wizardPad}>
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
              <TouchableOpacity style={[styles.primaryButton, styles.marginTopAuto]} onPress={() => setAppStep(4)}><Text style={styles.primaryButtonText}>Proceed to Payment</Text></TouchableOpacity>
            </View>
          )}

          {appStep === 4 && (
            <View style={styles.wizardPad}>
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
              {/* THIS BUTTON NOW CALLS THE PYTHON API */}
              <TouchableOpacity style={[styles.primaryButton, styles.marginTopAuto, (!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)) && styles.buttonDisabled]} onPress={handleTransferSubmit} disabled={!paymentMethod || (paymentMethod === 'upi' && !isUpiVerified)}><Text style={styles.primaryButtonText}>Proceed to Pay ₹ {formatNum(rawInr)}</Text></TouchableOpacity>
            </View>
          )}

          {appStep === 5 && (
            <View style={styles.wizardPad}>
              <View style={styles.wizardHeader}>
                <TouchableOpacity onPress={() => setAppStep(4)}><Text style={styles.backArrow}>&lt;</Text></TouchableOpacity>
                <Text style={styles.wizardTitle}>Your transaction is in process</Text>
              </View>
              <View style={{alignItems: 'center', marginVertical: 30}}>
                <Text style={{fontSize: 60, marginBottom: 16}}>🇺🇸🔄🇮🇳</Text>
                <Text style={{fontSize: 14, color: '#4A5568', fontWeight: '500'}}>Your money will be sent to the US in 15 minutes!</Text>
              </View>
              <TouchableOpacity style={[styles.primaryButton, styles.marginTopAuto]} onPress={() => { setAppStep(1); setPaymentMethod(''); setIsUpiVerified(false); setSendAmountInr('100000'); }}><Text style={styles.primaryButtonText}>Go back to home</Text></TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Shared Styles
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollWrapper: { flexGrow: 1 },
  fullHeight: { flex: 1 },
  wizardPad: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, backgroundColor: '#FFFFFF' },
  
  // Mobile Home Screen
  blueHeaderBlock: { backgroundColor: '#003DA5', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 80, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  mobileAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CBD5E0', marginRight: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  greetingText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  bellIcon: { fontSize: 22, color: '#FFFFFF', backgroundColor: '#E53E3E', borderRadius: 12, overflow: 'hidden' }, // Mocking the red notification badge
  balanceLabel: { color: '#E2E8F0', fontSize: 14, marginBottom: 8 },
  balanceRowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  balanceAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginRight: 12 },
  currencyPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currencyPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  floatingCardsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -50 },
  quickActionCard: { backgroundColor: '#FFFFFF', width: '31%', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  quickActionIcon: { fontSize: 28, marginBottom: 12 },
  quickActionText: { fontSize: 11, color: '#4A5568', textAlign: 'center', fontWeight: '500', lineHeight: 14 },
  
  transactionListContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
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

  // Forms & Inputs
  wizardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backArrow: { fontSize: 22, color: '#1A202C', marginRight: 16, fontWeight: '600' },
  wizardTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C' },
  inputBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 16, fontSize: 15, backgroundColor: '#FFFFFF', marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#4A5568', marginBottom: 8, fontWeight: '500' },
  currencyInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 16, marginBottom: 24 },
  currencyInputRowDisabled: { backgroundColor: '#F7FAFC' },
  currencyInput: { flex: 1, paddingVertical: 16, fontSize: 16, fontWeight: '600', color: '#1A202C' },
  currencyInputDisabled: { flex: 1, paddingVertical: 16, fontSize: 16, fontWeight: '700', color: '#38A169' },
  currencyTag: { fontSize: 14, color: '#718096', fontWeight: '600', backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  rateBanner: { backgroundColor: '#EBF8FF', padding: 12, borderRadius: 8, marginBottom: 24, alignItems: 'center' },
  rateText: { color: '#0047AB', fontWeight: '600', fontSize: 14 },
  summaryCard: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, padding: 20, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryText: { fontSize: 14, color: '#4A5568' },
  summaryTextBold: { fontSize: 14, fontWeight: '600', color: '#1A202C' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  textGreenLg: { color: '#38A169', fontSize: 18, fontWeight: '700' },
  paymentOptionBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 16 },
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
  primaryButton: { backgroundColor: '#0047AB', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#A0AEC0' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  marginTopAuto: { marginTop: 'auto' },

  // ==========================================
  // Desktop Specific Styles (Customer Web App)
  // ==========================================
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
  desktopScrollContent: { flexGrow: 1, padding: 40, paddingBottom: 250 }, 
  desktopBlueBanner: { backgroundColor: '#003DA5', borderRadius: 20, padding: 40, paddingBottom: 80 },
  bannerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bannerBalanceCenter: { alignItems: 'center' },
  
  desktopFloatingCardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: -50, paddingHorizontal: 20 },
  desktopActionCard: { backgroundColor: '#FFFFFF', width: 200, paddingVertical: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  desktopActionIcon: { fontSize: 32, marginBottom: 16 },
  desktopActionText: { fontSize: 14, color: '#1A202C', textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  
  desktopHistoryContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, marginTop: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  desktopTxGroup: { marginBottom: 10 },
  desktopTxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  
  desktopWizardContainer: { width: '100%', alignItems: 'center', paddingTop: 20 }, 
  desktopWizardCard: { 
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    maxWidth: 500, 
    borderRadius: 16, 
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 80, 
    overflow: 'visible', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  }
});