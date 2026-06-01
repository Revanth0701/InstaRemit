import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, useWindowDimensions, Image } from 'react-native';

export default function RegistrationWizard({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 768;
  
  const [emailPhone, setEmailPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [country, setCountry] = useState('');
  
  const [kycType, setKycType] = useState('PAN Card'); 
  const [kycNumber, setKycNumber] = useState('');     

  function nextStep() {
    // We now have 8 steps! Step 8 routes back to Login.
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Login'); // Redirects to Welcome Back / Login page
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  }

  function getProgressWidth() {
    return (currentStep / 8) * 100 + '%';
  }

  function getHeaderTitle() {
    if (currentStep <= 5) {
      return "Signing up with email/phone";
    }
    if (currentStep <= 7) {
      return "KYC Registration";
    }
    return "Verification Complete";
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        <View style={[styles.layoutWrapper, isDesktop && styles.desktopRow]}>
          
          {isDesktop && (
            <View style={styles.desktopLeftPanel}>
              <View style={styles.brandContainer}>
                <Image source={require('../assets/logo.png')} style={styles.desktopLogoImage} />
                <Text style={styles.desktopTagline}>       InstaRemit</Text>
                <Text style={styles.desktopDescription}>
                  Inflow streaming ledger designed for lightning-fast cross-border clearings and real-time exchange rate matrices.
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.formColumn, isDesktop && styles.desktopRightPanel]}>
            <View style={[styles.formCard, isDesktop && styles.desktopFormCardStyle]}>

              <View style={styles.navBar}>
                {/* Hide back button on the final success screen */}
                {currentStep < 8 ? (
                  <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.placeholderSide} />
                )}
                <Text style={styles.navTitle}>{getHeaderTitle()}</Text>
                <View style={styles.placeholderSide} />
              </View>

              <View style={styles.progressTrackBar}>
                <View style={[styles.progressActiveFill, { width: getProgressWidth() }]} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                <View style={styles.formContent}>

                  {currentStep === 1 && (
                    <View>
                      <Text style={styles.mainTitle}>Add your email/phone</Text>
                      <Text style={styles.subLabelText}>We'll send a verification code to secure your account</Text>
                      <TextInput 
                        style={styles.formInputBox} 
                        placeholder="Email address or mobile number" 
                        placeholderTextColor="#A0AEC0"
                        value={emailPhone}
                        onChangeText={setEmailPhone}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  {currentStep === 2 && (
                    <View>
                      <Text style={styles.mainTitle}>OTP Verification</Text>
                      <Text style={styles.subLabelText}>Enter the 6-digit verification code sent to your device</Text>
                      
                      <View style={styles.otpGridWrapper}>
                        <View style={[styles.otpDisplayCell, otp.length === 0 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[0] || ''}</Text></View>
                        <View style={[styles.otpDisplayCell, otp.length === 1 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[1] || ''}</Text></View>
                        <View style={[styles.otpDisplayCell, otp.length === 2 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[2] || ''}</Text></View>
                        <View style={[styles.otpDisplayCell, otp.length === 3 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[3] || ''}</Text></View>
                        <View style={[styles.otpDisplayCell, otp.length === 4 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[4] || ''}</Text></View>
                        <View style={[styles.otpDisplayCell, otp.length === 5 && styles.otpDisplayCellActive]}><Text style={styles.otpCellText}>{otp[5] || ''}</Text></View>
                      </View>

                      <TextInput 
                        style={styles.hiddenInputOverlay}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        autoFocus={true}
                      />
                    </View>
                  )}

                  {currentStep === 3 && (
                    <View>
                      <Text style={styles.mainTitle}>Home address</Text>
                      <Text style={styles.subLabelText}>Please provide your primary residential billing location</Text>
                      <TextInput style={styles.formInputBox} placeholder="Street Address" placeholderTextColor="#A0AEC0" value={street} onChangeText={setStreet} />
                      <TextInput style={styles.formInputBox} placeholder="City" placeholderTextColor="#A0AEC0" value={city} onChangeText={setCity} />
                      <TextInput style={styles.formInputBox} placeholder="Postal Code" placeholderTextColor="#A0AEC0" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
                    </View>
                  )}

                  {currentStep === 4 && (
                    <View>
                      <Text style={styles.mainTitle}>Add your personal info</Text>
                      <Text style={styles.subLabelText}>Ensure this matches your legal identity documents exactly</Text>
                      <TextInput style={styles.formInputBox} placeholder="Full Legal Name" placeholderTextColor="#A0AEC0" value={fullName} onChangeText={setFullName} />
                      <TextInput style={styles.formInputBox} placeholder="Date of Birth (DD/MM/YYYY)" placeholderTextColor="#A0AEC0" value={dob} onChangeText={setDob} />
                      <TextInput style={styles.formInputBox} placeholder="Nationality" placeholderTextColor="#A0AEC0" value={nationality} onChangeText={setNationality} />
                    </View>
                  )}

                  {currentStep === 5 && (
                    <View>
                      <Text style={styles.mainTitle}>Country of residence</Text>
                      <Text style={styles.subLabelText}>Select the primary economic country you reside in</Text>
                      <TextInput style={styles.formInputBox} placeholder="Select Country" placeholderTextColor="#A0AEC0" value={country} onChangeText={setCountry} />
                    </View>
                  )}

                  {currentStep === 6 && (
                    <View style={styles.alignItemsCenter}>
                      <Text style={styles.illustrationPlaceholder}>🧑‍💻</Text> 
                      <Text style={styles.mainTitleCenter}>Select your identity document to proceed</Text>
                      
                      <View style={styles.kycOptionsWrapper}>
                        <TouchableOpacity style={[styles.documentItemRow, kycType === 'PAN Card' && styles.documentItemRowActive]} onPress={() => setKycType('PAN Card')} activeOpacity={0.8}>
                          <Text style={styles.docItemText}>💳 PAN Card</Text>
                          <Text style={styles.docStatusDot}>{kycType === 'PAN Card' ? '🟢' : '⚪'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.documentItemRow, kycType === 'Aadhar Card' && styles.documentItemRowActive]} onPress={() => setKycType('Aadhar Card')} activeOpacity={0.8}>
                          <Text style={styles.docItemText}>🏛️ Aadhar Card</Text>
                          <Text style={styles.docStatusDot}>{kycType === 'Aadhar Card' ? '🟢' : '⚪'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.documentItemRow, kycType === 'Passport' && styles.documentItemRowActive]} onPress={() => setKycType('Passport')} activeOpacity={0.8}>
                          <Text style={styles.docItemText}>🛂 Passport</Text>
                          <Text style={styles.docStatusDot}>{kycType === 'Passport' ? '🟢' : '⚪'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.documentItemRow, kycType === 'Visa' && styles.documentItemRowActive]} onPress={() => setKycType('Visa')} activeOpacity={0.8}>
                          <Text style={styles.docItemText}>📄 Visa</Text>
                          <Text style={styles.docStatusDot}>{kycType === 'Visa' ? '🟢' : '⚪'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {currentStep === 7 && (
                    <View>
                      <Text style={styles.mainTitle}>{kycType}</Text>
                      <Text style={styles.subLabelText}>Upload photo and enter details to secure verify</Text>
                      
                      <TextInput 
                        style={styles.formInputBox} 
                        placeholder={
                          kycType === 'Aadhar Card' ? 'Enter 12-Digit Aadhar Number' : 
                          kycType === 'PAN Card' ? 'Enter 10-Digit PAN Number' : 
                          `Enter ${kycType} Number`
                        }
                        placeholderTextColor="#A0AEC0"
                        autoCapitalize="characters"
                        maxLength={kycType === 'Aadhar Card' ? 12 : kycType === 'PAN Card' ? 10 : 20}
                        keyboardType={kycType === 'Aadhar Card' ? 'number-pad' : 'default'}
                        value={kycNumber}
                        onChangeText={setKycNumber}
                      />
                      
                      <TouchableOpacity style={styles.uploadBoxPlaceholder}>
                        <Text style={styles.uploadBoxIcon}>📤</Text>
                        <Text style={styles.uploadBoxText}>Click to upload {kycType} photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* NEW STEP 8: SUCCESS SCREEN */}
                  {currentStep === 8 && (
                    <View style={{alignItems: 'center', paddingVertical: 40}}>
                      <Text style={{fontSize: 70, marginBottom: 24}}>✅</Text>
                      <Text style={{fontSize: 24, fontWeight: '700', color: '#1A202C', marginBottom: 12}}>Verification Successful!</Text>
                      <Text style={{fontSize: 15, color: '#718096', textAlign: 'center', lineHeight: 22}}>
                        Your identity has been verified securely. Your account is now active and ready for transfers.
                      </Text>
                    </View>
                  )}

                </View>

                {/* Persistent Action Buttons with updated text logic */}
                <View style={styles.footerContainer}>
                  <TouchableOpacity style={styles.primaryActionButton} activeOpacity={0.9} onPress={nextStep}>
                    <Text style={styles.primaryActionButtonText}>
                      {
                        currentStep === 6 ? "Link KYC Document" : 
                        currentStep === 7 ? "Submit & Verify" : 
                        currentStep === 8 ? "Continue to Login" : 
                        "Continue"
                      }
                    </Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', height: Platform.OS === 'web' ? '100vh' : '100%' },
  layoutWrapper: { flex: 1, justifyContent: 'center' },
  desktopRow: { flexDirection: 'row' },
  
  desktopLeftPanel: { flex: 1.2, backgroundColor: '#001E62', padding: 60, justifyContent: 'space-between' },
  brandContainer: { marginTop: 'auto', marginBottom: 'auto', maxWidth: 460 },
  desktopLogoImage: { width: 180, height: 60, resizeMode: 'contain', marginBottom: 16 },
  desktopTagline: { color: '#fdfeff', fontSize: 20, fontWeight: '600', marginBottom: 12 },
  desktopDescription: { color: '#A0AEC0', fontSize: 15, lineHeight: 24 },

  formColumn: { flex: 1, justifyContent: 'center' },
  desktopRightPanel: { backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  
  formCard: { flex: 1, width: '100%', maxWidth: 480, maxHeight: 700 }, 
  desktopFormCardStyle: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, overflow: 'hidden' },

  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, paddingHorizontal: 16, backgroundColor: '#FFFFFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 24, color: '#000000', fontWeight: '600' },
  navTitle: { fontSize: 15, fontWeight: '600', color: '#1A202C' },
  placeholderSide: { width: 40 },
  progressTrackBar: { height: 3, width: '100%', backgroundColor: '#EDF2F7' },
  progressActiveFill: { height: '100%', backgroundColor: '#38A169' }, 
  
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  formContent: { marginTop: 20 }, 
  
  mainTitle: { fontSize: 22, fontWeight: '700', color: '#000000', marginBottom: 6 },
  
  mainTitleCenter: { fontSize: 18, fontWeight: '700', color: '#000000', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  illustrationPlaceholder: { fontSize: 50, marginVertical: 10 }, 
  
  subLabelText: { fontSize: 14, color: '#718096', marginBottom: 20, lineHeight: 20 },
  
  formInputBox: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, color: '#000000', backgroundColor: '#F8F9FA', marginBottom: 12 },
  
  otpGridWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  otpDisplayCell: { width: 45, height: 55, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  otpDisplayCellActive: { borderColor: '#0052CC', borderWidth: 2 },
  otpCellText: { fontSize: 22, fontWeight: '600', color: '#000000' },
  hiddenInputOverlay: { position: 'absolute', width: '100%', height: 70, opacity: 0 },
  alignItemsCenter: { alignItems: 'center' },
  
  kycOptionsWrapper: { width: '100%', gap: 10 }, 
  
  documentItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 10, backgroundColor: '#FAFAFA', marginBottom: 10 },
  documentItemRowActive: { borderColor: '#0047AB', backgroundColor: '#F0F4F8' }, 
  docItemText: { fontSize: 15, fontWeight: '600', color: '#1A202C' },
  docStatusDot: { fontSize: 14 },
  
  uploadBoxPlaceholder: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 10, height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', marginTop: 10 },
  uploadBoxIcon: { fontSize: 32, marginBottom: 8 },
  uploadBoxText: { fontSize: 14, color: '#718096', fontWeight: '500' },
  
  footerContainer: { marginTop: 20, marginBottom: 10 },
  primaryActionButton: { backgroundColor: '#0047AB', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryActionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});